import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Download,
  Filter,
  History as HistoryIcon,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  DemoBadge,
  EmptyState,
  InfoNote,
  Panel,
  StatusPill,
} from '@/components/ui';
import { PRODUCT_CATEGORIES, type Inspection, type InspectionStatus, type ProductCategory } from '@/types';
import { clearInspections, deleteInspection, loadInspections } from '@/lib/storage';
import { downloadInspectionReport } from '@/lib/report';
import { formatDateTime, formatDuration, formatScore } from '@/lib/utils';

type StatusFilter = 'ALL' | InspectionStatus;
type CategoryFilter = 'ALL' | ProductCategory;

export default function HistoryPage() {
  const [records, setRecords] = useState<Inspection[]>(() => loadInspections());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (statusFilter !== 'ALL' && record.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && record.category !== categoryFilter) return false;
      if (!needle) return true;
      return (
        record.id.toLowerCase().includes(needle) ||
        record.category.toLowerCase().includes(needle) ||
        record.imageName.toLowerCase().includes(needle) ||
        (record.notes ?? '').toLowerCase().includes(needle)
      );
    });
  }, [records, query, statusFilter, categoryFilter]);

  const handleDelete = () => {
    if (!pendingDelete) return;
    setRecords(deleteInspection(pendingDelete));
    setNotice(`Inspection ${pendingDelete} deleted from local history.`);
    setPendingDelete(null);
  };

  const handleClear = () => {
    clearInspections();
    setRecords([]);
    setClearOpen(false);
    setNotice('Local inspection history cleared.');
  };

  const handleReport = async (record: Inspection) => {
    setReporting(record.id);
    setNotice(null);
    try {
      await downloadInspectionReport(record);
    } catch {
      setNotice('The report could not be generated for this record.');
    } finally {
      setReporting(null);
    }
  };

  const activeFilters = query !== '' || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="info">
              <HistoryIcon className="h-3 w-3" />
              {records.length} stored
            </Badge>
            <DemoBadge label="Demo records" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Inspection history</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Every inspection saved in this browser. Records are kept in localStorage, newest first.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="md"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setClearOpen(true)}
            disabled={records.length === 0}
          >
            Clear history
          </Button>
          <Link
            to="/inspect"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-aqua-500 px-4 text-sm font-semibold text-[#04121f]"
          >
            New inspection
          </Link>
        </div>
      </div>

      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] px-4 py-2.5 text-xs text-brand-100">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <Panel>
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by inspection ID, category, image or notes…"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0a1526] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-slate-500">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
              className="h-10 rounded-xl border border-white/10 bg-[#0a1526] px-3 text-xs text-slate-200 outline-none focus:border-brand-400/60"
            >
              <option value="ALL">All categories</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 rounded-xl border border-white/10 bg-[#0a1526] px-3 text-xs text-slate-200 outline-none focus:border-brand-400/60"
            >
              <option value="ALL">All results</option>
              <option value="NORMAL">Normal</option>
              <option value="DEFECTIVE">Defective</option>
            </select>
            {activeFilters ? (
              <Button
                size="sm"
                variant="ghost"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  setQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                }}
              >
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="h-5 w-5" />}
            title={records.length === 0 ? 'No inspections stored yet' : 'No records match these filters'}
            description={
              records.length === 0
                ? 'Run an inspection to create the first record in this browser.'
                : 'Adjust the search or filters to see more records.'
            }
            action={
              activeFilters ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link
                  to="/inspect"
                  className="mt-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-aqua-500 px-4 py-2 text-xs font-semibold text-[#04121f]"
                >
                  Start inspection
                </Link>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-3 font-medium">Inspection ID</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Result</th>
                    <th className="px-3 py-3 font-medium">Score</th>
                    <th className="px-3 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/inspections/${record.id}`}
                          className="font-mono text-[12px] text-white hover:text-aqua"
                        >
                          {record.id}
                        </Link>
                        <p className="text-[11px] text-slate-600">{record.imageName}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{record.category}</td>
                      <td className="px-3 py-3 text-[12px] text-slate-400">
                        {formatDateTime(record.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={record.status} />
                      </td>
                      <td className="tabular px-3 py-3 font-mono text-[12px] text-slate-300">
                        {formatScore(record.anomalyScore)}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11.5px] text-slate-500">
                        {formatDuration(record.processingTimeMs)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/inspections/${record.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-brand-300 hover:bg-brand-500/10"
                          >
                            View
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleReport(record)}
                            disabled={reporting === record.id}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 disabled:opacity-50"
                            aria-label={`Download report for ${record.id}`}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(record.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                            aria-label={`Delete ${record.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-white/[0.05] lg:hidden">
              {filtered.map((record) => (
                <div key={record.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/inspections/${record.id}`}
                        className="font-mono text-[12px] text-white hover:text-aqua"
                      >
                        {record.id}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {record.category} · {formatDateTime(record.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={record.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500">
                      score {formatScore(record.anomalyScore)} · {formatDuration(record.processingTimeMs)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/inspections/${record.id}`}
                        className="rounded-lg px-2 py-1 text-[11.5px] font-medium text-brand-300"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(record.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:text-rose-300"
                        aria-label={`Delete ${record.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3 text-[11px] text-slate-500">
          <span>
            Showing {filtered.length} of {records.length} records
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
            localStorage · demo persistence
          </span>
        </div>
      </Panel>

      <InfoNote tone="warn" icon={<ShieldAlert className="h-4 w-4" />}>
        History is stored only in this browser. Newest four records keep their imagery; older entries retain
        summary data to stay within storage limits.
      </InfoNote>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete inspection record?"
        description="This removes the record from local storage. It cannot be undone."
        confirmLabel="Delete record"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={clearOpen}
        title="Clear all inspection history?"
        description="All locally stored records and images will be removed from this browser."
        confirmLabel="Clear everything"
        onConfirm={handleClear}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}
