import React, { useEffect, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export function AdminChurnRetentionPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [stats, setStats] = useState<any>(null);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, riskRes] = await Promise.all([
        adminService.getChurnStats(),
        adminService.getAtRiskUsers(20),
      ]);
      setStats(statsRes);
      setAtRisk(riskRes.users || riskRes || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await adminService.runChurnAnalysis();
      await loadData();
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendEmails = async () => {
    setSending(true);
    try {
      const res = await adminService.sendRetentionEmails();
      alert(`Retention emails sent: ${res.sent ?? 'done'}`);
    } finally {
      setSending(false);
    }
  };

  const kpis = [
    { label: adminLocale.churn.churnRate, value: `${((stats?.churnRate ?? 0) * 100).toFixed(1)}%` },
    { label: adminLocale.churn.atRiskUsers, value: stats?.atRiskCount ?? atRisk.length },
    { label: adminLocale.churn.totalAnalyzed, value: stats?.totalAnalyzed ?? 0 },
    { label: adminLocale.churn.avgProbability, value: `${((stats?.avgProbability ?? 0) * 100).toFixed(0)}%` },
  ];

  const riskBuckets = React.useMemo(() => {
    const buckets = [
      { range: '0-20%', count: 0 },
      { range: '20-40%', count: 0 },
      { range: '40-60%', count: 0 },
      { range: '60-80%', count: 0 },
      { range: '80-100%', count: 0 },
    ];
    atRisk.forEach((u: any) => {
      const p = (u.churnProbability ?? 0) * 100;
      if (p < 20) buckets[0].count++;
      else if (p < 40) buckets[1].count++;
      else if (p < 60) buckets[2].count++;
      else if (p < 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [atRisk]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-churn-title" aria-busy={loading || sending || analyzing}>
      <div>
        <h1 id="admin-churn-title" className="text-3xl font-bold">{adminLocale.churn.title}</h1>
        <p className="text-[#6B7280]">{adminLocale.churn.subtitle}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-sm text-[#6B7280]">{k.label}</p>
            <p className="text-2xl font-bold text-[#1B3A5C]">{loading ? '...' : k.value}</p>
          </Card>
        ))}
      </div>

      {/* Actions + chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-4">{adminLocale.churn.riskDistribution}</h3>
          <div className="h-64" role="img" aria-label="Bar chart of churn risk distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-4">{adminLocale.churn.actions}</h3>
          <div className="space-y-4">
            <Button onClick={handleRunAnalysis} className="w-full" disabled={analyzing}>
              {analyzing ? adminLocale.churn.runningAnalysis : adminLocale.churn.runAnalysis}
            </Button>
            <p className="text-sm text-[#6B7280]">
              Runs the ML model on all users and updates churn probabilities.
            </p>
            <Button onClick={handleSendEmails} variant="outline" className="w-full" disabled={sending}>
              {sending ? adminLocale.churn.sending : adminLocale.churn.sendEmails}
            </Button>
            <p className="text-sm text-[#6B7280]">
              Sends a personalized re-engagement email to all at-risk users.
            </p>
          </div>
        </Card>
      </div>

      {/* At-risk table */}
      <Card>
        <h3 className="font-bold mb-4">{adminLocale.churn.atRiskTable}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">At-risk users table with churn probability and subscription information</caption>
            <thead>
              <tr className="text-left border-b border-[#E5E7EB] text-[#6B7280]">
                <th scope="col" className="py-3 pr-3">{adminLocale.churn.name}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.churn.email}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.churn.probability}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.churn.lastLogin}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.churn.subscription}</th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map((user: any) => (
                <tr key={user.id || user.email} className="border-b border-[#F3F4F6]">
                  <td className="py-3 pr-3">{user.name || '-'}</td>
                  <td className="py-3 pr-3 break-all">{user.email}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (user.churnProbability ?? 0) > 0.7
                          ? 'bg-[#EF4444]/10 text-[#EF4444]'
                          : (user.churnProbability ?? 0) > 0.4
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          : 'bg-[#10B981]/10 text-[#10B981]'
                      }`}
                    >
                      {((user.churnProbability ?? 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 pr-3">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</td>
                  <td className="py-3 pr-3 capitalize">{user.subscription?.plan || user.plan || 'free'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!atRisk.length && !loading && <p className="text-[#6B7280] py-6 text-center" role="status">{adminLocale.churn.noAtRiskUsers}</p>}
        </div>
      </Card>
    </main>
  );
}
