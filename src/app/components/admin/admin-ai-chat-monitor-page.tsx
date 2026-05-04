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

interface ChatStats {
  totalConversations?: number;
  totalMessages?: number;
  activeUsers?: number;
  avgMessagesPerChat?: number;
  dailyStats?: Array<{ date?: string; count?: number; messages?: number }>;
}

export function AdminAiChatMonitorPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const dateLocale = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar' : language === 'es' ? 'es-ES' : 'en-US';
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminService.getChatStatistics();
        setStats(res);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = [
    { label: adminLocale.ai.totalConversations, value: stats?.totalConversations ?? 0 },
    { label: adminLocale.ai.totalMessages, value: stats?.totalMessages ?? 0 },
    { label: adminLocale.ai.activeUsers, value: stats?.activeUsers ?? 0 },
    { label: adminLocale.ai.avgMessagesPerChat, value: stats?.avgMessagesPerChat?.toFixed(1) ?? '0' },
  ];

  const dailyData = React.useMemo(() => {
    const source = Array.isArray(stats?.dailyStats) ? stats.dailyStats : [];
    return source
      .map((d: { date?: string; count?: number; messages?: number }) => {
        const parsedDate = d?.date ? new Date(d.date) : null;
        const safeDate = parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })
          : '';
        return {
          date: safeDate,
          messages: Number(d?.count ?? d?.messages ?? 0),
        };
      })
      .filter((item: { date: string; messages: number }) => item.date);
  }, [stats, dateLocale]);

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-ai-title" aria-describedby="admin-ai-live" aria-busy={loading}>
      <p id="admin-ai-live" className="sr-only" role="status" aria-live="polite">
        {loading ? adminLocale.ai.loadingStats : adminLocale.ai.title}
      </p>
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 id="admin-ai-title" className="text-3xl font-bold">{adminLocale.ai.title}</h1>
          <p className="text-[#6B7280]">{adminLocale.ai.subtitle}</p>
        </div>
        <Button variant="outline" onClick={load} aria-label={adminLocale.common.refresh}>{adminLocale.common.refresh}</Button>
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

      {/* Daily messages chart */}
      <Card>
        <h3 className="font-bold mb-4">{adminLocale.ai.dailyVolume}</h3>
        <div className="h-72" role="img" aria-label={adminLocale.ai.chartAria}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="messages" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#6B7280] h-full flex items-center justify-center" role="status">
              {adminLocale.common.noData}
            </p>
          )}
        </div>
      </Card>

      {/* Extra stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-3">{adminLocale.ai.topTopics}</h3>
          {stats?.topTopics && stats.topTopics.length > 0 ? (
            <ul className="space-y-2">
              {stats.topTopics.map((t: any, i: number) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-[#1B3A5C]">{t.topic || t.name}</span>
                  <span className="text-[#6B7280]">{t.count} {adminLocale.ai.mentions}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#6B7280] text-sm">{adminLocale.ai.noTopicData}</p>
          )}
        </Card>

        <Card>
          <h3 className="font-bold mb-3">{adminLocale.ai.modelPerformance}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">{adminLocale.ai.avgResponseTime}</span>
              <span className="font-semibold text-[#1B3A5C]">{stats?.avgResponseTime ? `${stats.avgResponseTime}ms` : adminLocale.common.notAvailable}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">{adminLocale.ai.errorRate}</span>
              <span className="font-semibold text-[#1B3A5C]">{stats?.errorRate != null ? `${(stats.errorRate * 100).toFixed(1)}%` : adminLocale.common.notAvailable}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">{adminLocale.ai.tokenUsage}</span>
              <span className="font-semibold text-[#1B3A5C]">{stats?.totalTokens?.toLocaleString() ?? adminLocale.common.notAvailable}</span>
            </div>
          </div>
        </Card>
      </div>

      {loading && (
        <Card>
          <p className="text-[#6B7280] text-center py-6" role="status">{adminLocale.ai.loadingStats}</p>
        </Card>
      )}
    </main>
  );
}
