import React, { useEffect, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

export function AdminSkinAnalysisMonitorPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', skinType: '', minScore: '', maxScore: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminAnalyses({
        limit: 50,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        skinType: filters.skinType || undefined,
        minScore: filters.minScore ? Number(filters.minScore) : undefined,
        maxScore: filters.maxScore ? Number(filters.maxScore) : undefined,
      });
      setRows(res.analyses || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-analysis-title" aria-describedby="admin-analysis-live" aria-busy={loading}>
      <p id="admin-analysis-live" className="sr-only" role="status" aria-live="polite">
        {loading ? adminLocale.analysis.loadingAnalyses : adminLocale.analysis.title}
      </p>
      <div>
        <h1 id="admin-analysis-title" className="text-3xl font-bold">{adminLocale.analysis.title}</h1>
        <p className="text-[#6B7280]">{adminLocale.analysis.subtitle}</p>
      </div>

      <Card>
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label htmlFor="analysis-from-date" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.analysis.fromDate}</label>
            <input id="analysis-from-date" type="date" className="border border-[#E5E7EB] rounded-xl px-3 py-2 w-full" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
          </div>
          <div>
            <label htmlFor="analysis-to-date" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.analysis.toDate}</label>
            <input id="analysis-to-date" type="date" className="border border-[#E5E7EB] rounded-xl px-3 py-2 w-full" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
          </div>
          <div>
            <label htmlFor="analysis-skin-type" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.analysis.skinType}</label>
            <input id="analysis-skin-type" placeholder={adminLocale.analysis.skinType} className="border border-[#E5E7EB] rounded-xl px-3 py-2 w-full" value={filters.skinType} onChange={(e) => setFilters({ ...filters, skinType: e.target.value })} />
          </div>
          <div>
            <label htmlFor="analysis-min-score" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.analysis.minScore}</label>
            <input id="analysis-min-score" placeholder={adminLocale.analysis.minScore} inputMode="numeric" className="border border-[#E5E7EB] rounded-xl px-3 py-2 w-full" value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value })} />
          </div>
          <div>
            <label htmlFor="analysis-max-score" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.analysis.maxScore}</label>
            <input id="analysis-max-score" placeholder={adminLocale.analysis.maxScore} inputMode="numeric" className="border border-[#E5E7EB] rounded-xl px-3 py-2 w-full" value={filters.maxScore} onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })} />
          </div>
          <Button onClick={load} aria-label={adminLocale.common.apply}>{adminLocale.common.apply}</Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">Analysis monitor table with user, score, conditions and retry action</caption>
            <thead>
              <tr className="text-left border-b border-[#E5E7EB] text-[#6B7280]">
                <th scope="col" className="py-3 pr-3">{adminLocale.analysis.user}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.analysis.date}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.analysis.skinScore}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.analysis.conditions}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.analysis.aiResponseTime}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.analysis.status}</th>
                <th scope="col" className="py-3">{adminLocale.analysis.action}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#F3F4F6]">
                  <th scope="row" className="py-3 pr-3 font-medium">{row.user?.email || '-'}</th>
                  <td className="py-3 pr-3">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="py-3 pr-3">{row.healthScore ?? '-'}</td>
                  <td className="py-3 pr-3">{(row.conditions || []).slice(0, 3).join(', ') || '-'}</td>
                  <td className="py-3 pr-3">{row.processingTime ? `${row.processingTime} ms` : '-'}</td>
                  <td className="py-3 pr-3">{row.status}</td>
                  <td className="py-3">
                    {row.status === 'failed' ? (
                      <Button size="sm" variant="outline" onClick={async () => { await adminService.retryAnalysisAsAdmin(row.id); await load(); }} aria-label={`Retry analysis for ${row.user?.email || 'user'}`}>
                        {adminLocale.analysis.retry}
                      </Button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && !loading && <p className="text-[#6B7280] py-6" role="status">{adminLocale.analysis.noAnalyses}</p>}
          {loading && <p className="text-[#6B7280] py-6" role="status">{adminLocale.analysis.loadingAnalyses}</p>}
        </div>
      </Card>
    </main>
  );
}
