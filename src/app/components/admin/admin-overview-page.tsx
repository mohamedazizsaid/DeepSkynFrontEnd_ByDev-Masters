import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../card';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

const chartColors = ['#0EA5E9', '#06B6D4', '#1B3A5C', '#10B981', '#F59E0B'];

export function AdminOverviewPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [biData, setBiData] = useState<any>(null);

  useEffect(() => {
    Promise.allSettled([
      adminService.getOverviewStats(),
      adminService.getBiDashboard(),
    ])
      .then(([overviewResult, biResult]) => {
        if (overviewResult.status === 'fulfilled') {
          setData(overviewResult.value);
        }
        if (biResult.status === 'fulfilled') {
          setBiData(biResult.value);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => {
    const skin = data.skin || {};
    const analyses = data.analyses || {};
    const subs = data.subscriptions || {};
    const churn = data.churn || {};

    return [
      {
        label: adminLocale.overview.totalUsers,
        value: Math.max(Number(skin.totalProfiles || 0), Number(churn.totalUsers || 0)),
      },
      { label: adminLocale.overview.activeSubscriptions, value: subs.activeSubscriptions ?? 0 },
      { label: adminLocale.overview.scansToday, value: analyses.completedAnalyses ?? 0 },
      { label: adminLocale.bi.mrr, value: `${Math.round(subs.monthlyRecurringRevenue || 0)} TND` },
      { label: adminLocale.overview.churnRate, value: `${((churn.churnRate ?? 0) * 100).toFixed(1)}%` },
    ];
  }, [data, adminLocale]);

  const signupsData = useMemo(() => {
    const series = biData?.engagement?.activitySeries;
    if (!Array.isArray(series) || !series.length) {
      return [];
    }

    return series.map((point: any) => ({
      month: String(point?.date || '').slice(5),
      users: Number(point?.signups || 0),
    }));
  }, [biData]);

  const tierData = useMemo(() => {
    const subscriptionsByPlan = data.subscriptions?.subscriptionsByPlan || [];
    return subscriptionsByPlan
      .map((s: any) => ({ name: String(s?.plan || ''), value: Number(s?.count || 0) }))
      .filter((item: any) => item.name && item.value > 0);
  }, [data]);

  const topConditions = useMemo(() => {
    const conditions = data.analyses?.topConditions || [];
    return conditions
      .map((c: any) => ({ name: String(c?.condition || c?.name || ''), value: Number(c?.count || c?.value || 0) }))
      .filter((item: any) => item.name && item.value > 0);
  }, [data]);

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-overview-title" aria-describedby="admin-overview-live" aria-busy={loading}>
      <p id="admin-overview-live" className="sr-only" role="status" aria-live="polite">
        {loading ? adminLocale.common.loading : adminLocale.overview.title}
      </p>
      <div>
        <h1 id="admin-overview-title" className="text-3xl font-bold">{adminLocale.overview.title}</h1>
        <p className="text-[#6B7280]">{adminLocale.overview.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-[#6B7280]">{kpi.label}</p>
            <p className="text-2xl font-bold text-[#1B3A5C]">{loading ? '...' : kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-4">{adminLocale.overview.signupsOverTime}</h3>
          <div className="h-64" role="img" aria-label={adminLocale.overview.signupsOverTime}>
            {signupsData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#0EA5E9" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#6B7280] h-full flex items-center justify-center" role="status">
                {adminLocale.common.noData}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-4">{adminLocale.overview.tierDistribution}</h3>
          <div className="h-64" role="img" aria-label={adminLocale.overview.tierDistribution}>
            {tierData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierData} dataKey="value" nameKey="name" outerRadius={90}>
                    {tierData.map((_: any, index: number) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#6B7280] h-full flex items-center justify-center" role="status">
                {adminLocale.common.noData}
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-4">{adminLocale.overview.topConditions}</h3>
        <div className="h-72" role="img" aria-label={adminLocale.overview.topConditions}>
          {topConditions.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConditions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#00B4D8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#6B7280] h-full flex items-center justify-center" role="status">
              {adminLocale.common.noData}
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}
