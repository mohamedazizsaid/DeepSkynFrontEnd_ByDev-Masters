import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

const SHEET_ID = '1YFuEd3wa-YzWHRbdueNBYuwxGQzNRc50OylFU4k_HYg';
const SHEET_VIEW_URL =
  'https://docs.google.com/spreadsheets/u/0/d/1YFuEd3wa-YzWHRbdueNBYuwxGQzNRc50OylFU4k_HYg/htmlview?pli=1&usp=embed_facebook';
const SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

type ReclamationRow = {
  id: string;
  date: string;
  clientName: string;
  email: string;
  declaredType: string;
  aiCategory: string;
  sentiment: string;
  delay: string;
  description: string;
  internalSummary: string;
  status: string;
};

type StatusOverrideMap = Record<string, string>;

const STATUS_OVERRIDES_KEY = 'admin_reclamation_status_overrides';
const AUTO_REFRESH_MS = 45000;

function sanitize(value: unknown): string {
  return String(value ?? '').trim();
}

function parseGvizToRows(gvizPayload: string): ReclamationRow[] {
  const jsonStart = gvizPayload.indexOf('{');
  const jsonEnd = gvizPayload.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('Invalid gviz response');
  }

  const jsonText = gvizPayload.slice(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(jsonText) as {
    table?: {
      rows?: Array<{
        c?: Array<{ v?: string | number | boolean | null; f?: string | null } | null>;
      }>;
    };
  };

  const rows = parsed.table?.rows ?? [];

  return rows
    .map((row) => {
      const cells = row.c ?? [];
      const at = (index: number) => sanitize(cells[index]?.f ?? cells[index]?.v ?? '');

      return {
        id: at(0),
        date: at(1),
        clientName: at(2),
        email: at(3),
        declaredType: at(4),
        aiCategory: at(5),
        sentiment: at(6),
        delay: at(7),
        description: at(8),
        internalSummary: at(9),
        status: at(10),
      };
    })
    .filter((row) => row.id.length > 0);
}

function getStatusBadgeClass(status: string): string {
  const lowered = status.toLowerCase();

  if (lowered.includes('done') || lowered.includes('termine') || lowered.includes('resolved')) {
    return 'bg-[#10B981]/10 text-[#047857]';
  }

  if (lowered.includes('cours') || lowered.includes('analyse') || lowered.includes('progress')) {
    return 'bg-[#F59E0B]/10 text-[#B45309]';
  }

  if (lowered.includes('urgent') || lowered.includes('bloque')) {
    return 'bg-[#EF4444]/10 text-[#B91C1C]';
  }

  return 'bg-[#0EA5E9]/10 text-[#0369A1]';
}

function getSentimentBadgeClass(sentiment: string): string {
  const lowered = sentiment.toLowerCase();

  if (lowered.includes('insatisf') || lowered.includes('negative') || lowered.includes('negatif')) {
    return 'bg-[#EF4444]/10 text-[#B91C1C]';
  }

  if (lowered.includes('neutr')) {
    return 'bg-[#F59E0B]/10 text-[#B45309]';
  }

  if (lowered.includes('satisf') || lowered.includes('positif') || lowered.includes('positive')) {
    return 'bg-[#10B981]/10 text-[#047857]';
  }

  return 'bg-[#94A3B8]/20 text-[#475569]';
}

function isAnalyzingStatus(status: string): boolean {
  const lowered = status.toLowerCase();
  return lowered.includes('analyse') || lowered.includes('cours') || lowered.includes('progress');
}

function readStatusOverrides(): StatusOverrideMap {
  try {
    const raw = localStorage.getItem(STATUS_OVERRIDES_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as StatusOverrideMap;
  } catch {
    return {};
  }
}

function writeStatusOverrides(next: StatusOverrideMap): void {
  localStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(next));
}

export function AdminReclamationsPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);

  const [rows, setRows] = useState<ReclamationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<StatusOverrideMap>(() => readStatusOverrides());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const loadRows = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(SHEET_GVIZ_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.text();
        const parsedRows = parseGvizToRows(payload).map((row) => ({
          ...row,
          status: statusOverrides[row.id] || row.status,
        }));
        setRows(parsedRows);
        setLastUpdatedAt(new Date());
      } catch {
        setError(adminLocale.reclamations.loadError);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    void loadRows();
  }, [statusOverrides, adminLocale]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadRows();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [statusOverrides]);

  const markAsDone = (rowId: string) => {
    const nextOverrides = {
      ...statusOverrides,
      [rowId]: adminLocale.reclamations.doneStatus,
    };

    setStatusOverrides(nextOverrides);
    writeStatusOverrides(nextOverrides);

    setRows((previous) =>
      previous.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: adminLocale.reclamations.doneStatus,
            }
          : row
      )
    );
  };

  const statusOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const lowered = search.toLowerCase().trim();

    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) {
        return false;
      }

      if (!lowered) {
        return true;
      }

      return [
        row.id,
        row.clientName,
        row.email,
        row.declaredType,
        row.aiCategory,
        row.sentiment,
        row.status,
        row.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(lowered);
    });
  }, [rows, search, statusFilter]);

  const unresolvedCount = useMemo(() => {
    return rows.filter((row) => row.status.toLowerCase().includes('cours') || row.status.toLowerCase().includes('analyse')).length;
  }, [rows]);

  const dissatisfiedCount = useMemo(() => {
    return rows.filter((row) => row.sentiment.toLowerCase().includes('insatisf')).length;
  }, [rows]);

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-reclamations-title" aria-describedby="admin-reclamations-live" aria-busy={loading}>
      <p id="admin-reclamations-live" className="sr-only" role="status" aria-live="polite">
        {loading ? adminLocale.reclamations.loading : adminLocale.reclamations.title}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="admin-reclamations-title" className="text-3xl font-bold">{adminLocale.reclamations.title}</h1>
          <p className="text-[#6B7280]">{adminLocale.reclamations.subtitle}</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {adminLocale.reclamations.autoRefreshHint}
            {lastUpdatedAt ? ` - ${adminLocale.reclamations.lastUpdated}: ${lastUpdatedAt.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadRows()}>{adminLocale.common.refresh}</Button>
          <a
            href={SHEET_VIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium hover:bg-[#F9FAFB]"
          >
            {adminLocale.reclamations.openSource}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-[#6B7280]">{adminLocale.reclamations.total}</p>
          <p className="text-2xl font-bold text-[#1B3A5C]">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B7280]">{adminLocale.reclamations.inProgress}</p>
          <p className="text-2xl font-bold text-[#D97706]">{unresolvedCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B7280]">{adminLocale.reclamations.unsatisfied}</p>
          <p className="text-2xl font-bold text-[#DC2626]">{dissatisfiedCount}</p>
        </Card>
      </div>

      <Card>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="min-w-[280px] flex-1">
            <label htmlFor="admin-reclamation-search" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.reclamations.search}</label>
            <input
              id="admin-reclamation-search"
              className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
              placeholder={adminLocale.reclamations.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="admin-reclamation-status" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.reclamations.status}</label>
            <select
              id="admin-reclamation-status"
              className="border border-[#E5E7EB] rounded-xl px-4 py-2"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">{adminLocale.reclamations.allStatuses}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {error && <p className="text-[#EF4444] mb-4" role="alert">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">{adminLocale.reclamations.title}</caption>
            <thead>
              <tr className="text-left border-b border-[#E5E7EB] text-[#6B7280]">
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.id}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.date}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.client}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.email}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.type}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.sentiment}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.delay}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.reclamations.status}</th>
                <th scope="col" className="py-3">{adminLocale.reclamations.description}</th>
                <th scope="col" className="py-3">{adminLocale.reclamations.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-[#F3F4F6] align-top">
                  <th scope="row" className="py-3 pr-3 font-medium whitespace-nowrap">{row.id}</th>
                  <td className="py-3 pr-3 whitespace-nowrap">{row.date || '-'}</td>
                  <td className="py-3 pr-3">{row.clientName || '-'}</td>
                  <td className="py-3 pr-3 break-all">{row.email || '-'}</td>
                  <td className="py-3 pr-3">{row.aiCategory || row.declaredType || '-'}</td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSentimentBadgeClass(row.sentiment)}`}>{row.sentiment || '-'}</span>
                  </td>
                  <td className="py-3 pr-3">{row.delay || '-'}</td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(row.status)}`}>{row.status || '-'}</span>
                  </td>
                  <td className="py-3 max-w-[360px]">{row.description || row.internalSummary || '-'}</td>
                  <td className="py-3">
                    {isAnalyzingStatus(row.status) ? (
                      <Button size="sm" variant="outline" onClick={() => markAsDone(row.id)}>
                        {adminLocale.reclamations.markDone}
                      </Button>
                    ) : (
                      <span className="text-xs text-[#6B7280]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !filteredRows.length && <p className="text-[#6B7280] py-6" role="status">{adminLocale.reclamations.noData}</p>}
          {loading && <p className="text-[#6B7280] py-6" role="status">{adminLocale.reclamations.loading}</p>}
        </div>
      </Card>
    </main>
  );
}
