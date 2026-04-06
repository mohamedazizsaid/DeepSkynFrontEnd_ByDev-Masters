import React, { useEffect, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const COLORS = ['#0EA5E9', '#06B6D4', '#1B3A5C', '#10B981', '#F59E0B', '#EF4444'];

export function AdminSubscriptionManagementPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [stats, setStats] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes] = await Promise.all([
        adminService.getSubscriptionsStats(),
        adminService.getAllSubscriptions({ plan: planFilter || undefined, status: statusFilter || undefined, limit: 50 }),
      ]);
      setStats(statsRes);
      setSubscriptions(Array.isArray(subsRes) ? subsRes : subsRes.subscriptions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckExpired = async () => {
    await adminService.checkExpiredSubscriptions();
    await loadData();
  };

  const kpis = [
    { label: adminLocale.subscriptions.mrr, value: `${Math.round(stats?.monthlyRecurringRevenue || 0)} TND` },
    { label: adminLocale.subscriptions.active, value: stats?.activeSubscriptions ?? 0 },
    { label: adminLocale.subscriptions.total, value: stats?.totalSubscriptions ?? 0 },
    { label: adminLocale.subscriptions.expired, value: stats?.expiredSubscriptions ?? 0 },
  ];

  const planData = (stats?.subscriptionsByPlan || []).map((p: any) => ({
    name: p.plan,
    value: p.count,
  }));

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-subscriptions-title" aria-busy={loading}>
      <div>
        <h1 id="admin-subscriptions-title" className="text-3xl font-bold">{adminLocale.subscriptions.title}</h1>
        <p className="text-[#6B7280]">{adminLocale.subscriptions.subtitle}</p>
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

      {/* Pie chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-4">{adminLocale.subscriptions.planDistribution}</h3>
          <div className="h-64" role="img" aria-label="Subscription plan distribution pie chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {planData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-4">{adminLocale.subscriptions.quickActions}</h3>
          <div className="space-y-4">
            <Button onClick={handleCheckExpired} variant="outline" className="w-full">
              {adminLocale.subscriptions.expireOverdue}
            </Button>
            <p className="text-sm text-[#6B7280]">
              Scans all subscriptions past their end date and marks them expired.
            </p>
          </div>
        </Card>
      </div>

      {/* Filters + table */}
      <Card>
        <div className="flex gap-3 flex-wrap mb-4 items-end">
          <div>
            <label htmlFor="subscription-plan-filter" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.subscriptions.plan}</label>
          <select
            id="subscription-plan-filter"
            className="border border-[#E5E7EB] rounded-xl px-4 py-2"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">{adminLocale.subscriptions.allPlans}</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
          </div>
          <div>
            <label htmlFor="subscription-status-filter" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.subscriptions.status}</label>
          <select
            id="subscription-status-filter"
            className="border border-[#E5E7EB] rounded-xl px-4 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{adminLocale.subscriptions.allStatuses}</option>
            <option value="active">{adminLocale.subscriptions.active}</option>
            <option value="expired">{adminLocale.subscriptions.expired}</option>
            <option value="cancelled">{adminLocale.subscriptions.cancelled}</option>
          </select>
          </div>
          <Button onClick={loadData} aria-label={adminLocale.common.apply}>{adminLocale.common.apply}</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">Subscriptions table showing user, plan, status and billing dates</caption>
            <thead>
              <tr className="text-left border-b border-[#E5E7EB] text-[#6B7280]">
                <th scope="col" className="py-3 pr-3">User</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.subscriptions.plan}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.subscriptions.status}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.subscriptions.amount}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.subscriptions.start}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.subscriptions.end}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub: any) => (
                <tr key={sub.id} className="border-b border-[#F3F4F6]">
                  <td className="py-3 pr-3 break-all">{sub.user?.email || sub.userId}</td>
                  <td className="py-3 pr-3 capitalize">{sub.plan}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        sub.status === 'active'
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : sub.status === 'expired'
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          : 'bg-[#EF4444]/10 text-[#EF4444]'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3">{sub.amount ?? '-'} {sub.currency || ''}</td>
                  <td className="py-3 pr-3">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '-'}</td>
                  <td className="py-3 pr-3">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!subscriptions.length && !loading && <p className="text-[#6B7280] py-6 text-center" role="status">{adminLocale.subscriptions.noSubscriptions}</p>}
          {loading && <p className="text-[#6B7280] py-6 text-center" role="status">{adminLocale.common.loading}</p>}
        </div>
      </Card>
    </main>
  );
}
