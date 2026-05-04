import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

interface BiDashboardData {
  kpis: {
    totalUsers?: number;
    newUsersLast30?: number;
    userGrowthRate?: number;
    activeUsersLast30?: number;
    conversionRate?: number;
  };
  charts?: Record<string, unknown>;
}

interface TopCondition {
  name: string;
  value: number;
}

const riskColors = ['#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#94A3B8'];

export function AdminBiDashboardPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BiDashboardData | null>(null);
  const [fallbackTopConcerns, setFallbackTopConcerns] = useState<TopCondition[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [payloadResult, overviewResult] = await Promise.allSettled([
          adminService.getBiDashboard(),
          adminService.getOverviewStats(),
        ]);

        const payload = payloadResult.status === 'fulfilled' ? payloadResult.value : null;
        const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;

        setData(payload);
        const normalizedTop = Array.isArray(overview?.analyses?.topConditions)
          ? overview.analyses.topConditions.map((item: { name?: string; condition?: string; value?: number; count?: number }) => ({
              name: item?.name || item?.condition || '',
              value: Number(item?.value ?? item?.count ?? 0),
            }))
          : [];
        setFallbackTopConcerns(normalizedTop);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const kpis = useMemo(() => {
    const k = data?.kpis || {};
    return [
      {
        label: adminLocale.bi.totalUsers,
        value: Number(k.totalUsers || 0).toLocaleString(),
      },
      {
        label: adminLocale.bi.newUsers30,
        value: Number(k.newUsersLast30 || 0).toLocaleString(),
        delta: `${((k.userGrowthRate || 0) * 100).toFixed(1)}%`,
      },
      {
        label: adminLocale.bi.activeUsers30,
        value: Number(k.activeUsersLast30 || 0).toLocaleString(),
      },
      {
        label: adminLocale.bi.conversionRate,
        value: `${((k.conversionRate || 0) * 100).toFixed(1)}%`,
      },
      {
        label: adminLocale.bi.mrr,
        value: `${Math.round(k.mrr || 0)} TND`,
        delta: `${((k.revenueGrowthRate || 0) * 100).toFixed(1)}%`,
      },
      {
        label: adminLocale.bi.arpu,
        value: `${(k.arpu || 0).toFixed(2)} TND`,
      },
    ];
  }, [data, adminLocale]);

  const activitySeriesRaw = data?.engagement?.activitySeries || [];
  const activitySeries = activitySeriesRaw.map((point: any) => ({
    date: String(point?.date || ''),
    signups: Math.max(0, Number(point?.signups || 0)),
    analyses: Math.max(0, Number(point?.analyses || 0)),
    chats: Math.max(0, Number(point?.chats || 0)),
    posts: Math.max(0, Number(point?.posts || 0)),
  })).filter((point: any) => point.date);
  const hasActivity = activitySeries.some((point: any) =>
    Number(point?.signups || 0) > 0 ||
    Number(point?.analyses || 0) > 0 ||
    Number(point?.chats || 0) > 0 ||
    Number(point?.posts || 0) > 0,
  );
  const funnelData = useMemo(() => {
    const funnel = data?.funnel || {};
    return [
      { name: adminLocale.bi.registered, value: Number(funnel.registered || 0) },
      { name: adminLocale.bi.onboarded, value: Number(funnel.onboarded || 0) },
      { name: adminLocale.bi.analyzed, value: Number(funnel.analyzed || 0) },
      { name: adminLocale.bi.subscribed, value: Number(funnel.subscribed || 0) },
      { name: adminLocale.bi.retained30, value: Number(funnel.retained30d || 0) },
    ];
  }, [data, adminLocale]);

  const riskDistribution = (Array.isArray(data?.churn?.riskDistribution) ? data.churn.riskDistribution : [])
    .map((item: any) => ({
      name: String(item?.name || ''),
      value: Number(item?.value || 0),
    }))
    .filter((item: any) => item.name);

  const topConcerns = ((data?.insights?.topConcerns && data.insights.topConcerns.length)
    ? data.insights.topConcerns
    : fallbackTopConcerns)
    .map((item: any) => ({
      name: String(item?.name || ''),
      value: Number(item?.value || 0),
    }))
    .filter((item: any) => item.name && item.value > 0);

  const hasFunnelData = funnelData.some((item: any) => item.value > 0);
  const hasRiskData = riskDistribution.some((item: any) => item.value > 0);

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-bi-title" aria-describedby="admin-bi-live" aria-busy={loading}>
      <p id="admin-bi-live" className="sr-only" role="status" aria-live="polite">
        {loading ? adminLocale.common.loading : adminLocale.bi.title}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="admin-bi-title" className="text-3xl font-bold">{adminLocale.bi.title}</h1>
          <p className="text-[#6B7280]">{adminLocale.bi.subtitle}</p>
        </div>
        <Button onClick={() => void loadData()}>{adminLocale.common.refresh}</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-[#6B7280]">{kpi.label}</p>
            <p className="text-2xl font-bold text-[#1B3A5C]">{loading ? '...' : kpi.value}</p>
            {kpi.delta ? (
              <p className="text-xs mt-1 text-[#0EA5E9]">{adminLocale.bi.delta}: {kpi.delta}</p>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-4">{adminLocale.bi.activityTrend}</h3>
          <div className="h-72" role="img" aria-label={adminLocale.bi.activityTrend}>
            {activitySeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activitySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="signups" stroke="#0EA5E9" strokeWidth={2.5} dot={!hasActivity} />
                  <Line type="monotone" dataKey="analyses" stroke="#10B981" strokeWidth={2.5} dot={!hasActivity} />
                  <Line type="monotone" dataKey="chats" stroke="#F59E0B" strokeWidth={2.5} dot={!hasActivity} />
                  <Line type="monotone" dataKey="posts" stroke="#A855F7" strokeWidth={2.5} dot={!hasActivity} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#6B7280] h-full flex items-center justify-center" role="status">
                {adminLocale.bi.noActivity14}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-4">{adminLocale.bi.funnel}</h3>
          <div className="h-72" role="img" aria-label={adminLocale.bi.funnel}>
            {hasFunnelData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06B6D4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#6B7280] h-full flex items-center justify-center" role="status">
                {adminLocale.common.noData}
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-bold mb-4">{adminLocale.bi.riskDistribution}</h3>
          <div className="h-64" role="img" aria-label={adminLocale.bi.riskDistribution}>
            {hasRiskData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskDistribution} dataKey="value" nameKey="name" outerRadius={88}>
                    {riskDistribution.map((_: any, index: number) => (
                      <Cell key={`risk-${index}`} fill={riskColors[index % riskColors.length]} />
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
          <p className="text-xs text-[#6B7280] mt-2">
            {adminLocale.bi.avgRiskScore}: {(data?.churn?.avgRiskScore || 0).toFixed(3)}
          </p>
        </Card>

        <Card className="xl:col-span-2">
          <h3 className="font-bold mb-4">{adminLocale.bi.topConcerns}</h3>
          <div className="h-64" role="img" aria-label={adminLocale.bi.topConcerns}>
            {topConcerns.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topConcerns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1B3A5C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#6B7280] h-full flex items-center justify-center" role="status">
                {adminLocale.common.noData}
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-[#6B7280]">{adminLocale.bi.analysesLast30}</p>
          <p className="text-2xl font-bold text-[#0F172A]">{Number(data?.engagement?.analysesLast30 || 0).toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B7280]">{adminLocale.bi.avgProcessing}</p>
          <p className="text-2xl font-bold text-[#0F172A]">{Math.round(data?.engagement?.avgAnalysisProcessingTimeMs || 0)} ms</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B7280]">{adminLocale.bi.alertsLast30}</p>
          <p className="text-2xl font-bold text-[#0F172A]">{Number(data?.support?.skinAlertsLast30 || 0).toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B7280]">{adminLocale.bi.unreadAlerts}</p>
          <p className="text-2xl font-bold text-[#0F172A]">{Number(data?.support?.unreadAlerts || 0).toLocaleString()}</p>
        </Card>
      </div>
    </main>
  );
}
