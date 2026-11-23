import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CircleSlash,
  Cpu,
  Database,
  Gauge,
  History,
  Layers,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Badge,
  DemoBadge,
  EmptyState,
  InfoNote,
  Panel,
  PanelHeader,
  ProgressBar,
  StatCard,
  StatusPill,
} from '@/components/ui';
import { VISA_DATASET } from '@/types';
import { seedDemoHistory } from '@/lib/storage';
import { dayKey, formatDateShort, formatDuration, formatNumber, formatScore } from '@/lib/utils';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(8,17,31,0.96)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  fontSize: 12,
  color: '#e2e8f0',
};

export default function Dashboard() {
  const inspections = useMemo(() => seedDemoHistory(), []);

  const stats = useMemo(() => {
    const total = inspections.length;
    const normal = inspections.filter((item) => item.status === 'NORMAL').length;
    const defective = total - normal;
    const scores = inspections.map((item) => item.anomalyScore);
    const averageScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
    const averageTime = total
      ? inspections.reduce((sum, item) => sum + item.processingTimeMs, 0) / total
      : 0;
    return {
      total,
      normal,
      defective,
      rate: total ? defective / total : 0,
      averageScore,
      averageTime,
    };
  }, [inspections]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, { normal: number; defective: number }>();
    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      buckets.set(dayKey(date.toISOString()), { normal: 0, defective: 0 });
    }
    inspections.forEach((record) => {
      const bucket = buckets.get(dayKey(record.createdAt));
      if (!bucket) return;
      if (record.status === 'NORMAL') bucket.normal += 1;
      else bucket.defective += 1;
    });
    return Array.from(buckets.entries()).map(([key, value]) => ({
      day: formatDateShort(`${key}T00:00:00`),
      normal: value.normal,
      defective: value.defective,
    }));
  }, [inspections]);

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    inspections.forEach((record) => {
      counts.set(record.category, (counts.get(record.category) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [inspections]);

  const recent = inspections.slice(0, 5);

  const readiness = [
    { label: 'Upload & preview workstation', state: 'ready' as const },
    { label: 'Demo visualisation engine', state: 'demo' as const },
    { label: 'Deep feature extractor', state: 'offline' as const },
    { label: 'Normal feature memory bank', state: 'offline' as const },
    { label: 'Seeded region growing', state: 'offline' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="info">
              <Sparkles className="h-3 w-3" />
              Unsupervised inspection
            </Badge>
            <DemoBadge label="Frontend demo" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
            AI Manufacturing Inspection System
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
            Learns normal product appearance from the VisA reference set and flags previously unseen
            defects — scratches, dents, cracks and structural irregularities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/history"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200 transition hover:bg-white/[0.08]"
          >
            <History className="h-4 w-4" />
            History
          </Link>
          <Link
            to="/inspect"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-aqua-500 px-4 text-sm font-semibold text-[#04121f] shadow-[0_12px_34px_-18px_rgba(34,211,238,0.9)] transition hover:from-brand-400 hover:to-aqua-400"
          >
            <ScanSearch className="h-4 w-4" />
            New inspection
          </Link>
        </div>
      </div>

      <InfoNote tone="warn" icon={<ShieldAlert className="h-4 w-4" />}>
        <span className="font-semibold text-amber-200">No model backend is connected.</span> The metrics
        below are derived from locally stored demo records, not from a trained anomaly detector. Real
        inference will replace these values once the FastAPI service is integrated.
      </InfoNote>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total inspections"
          value={formatNumber(stats.total)}
          hint={`${stats.total > 0 ? 'Session records in local storage' : 'No records yet'}`}
          icon={<Layers className="h-4 w-4" />}
          accent="brand"
          tag={<Badge tone="demo">Demo data</Badge>}
        />
        <StatCard
          label="Normal products"
          value={formatNumber(stats.normal)}
          hint="Passed inspection, no anomaly above threshold"
          icon={<BadgeCheck className="h-4 w-4" />}
          accent="good"
          tag={<Badge tone="demo">Demo data</Badge>}
        />
        <StatCard
          label="Defective products"
          value={formatNumber(stats.defective)}
          hint="At least one anomaly region detected"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="bad"
          tag={<Badge tone="demo">Demo data</Badge>}
        />
        <StatCard
          label="Defect detection rate"
          value={`${(stats.rate * 100).toFixed(1)}%`}
          hint="Share of stored inspections flagged DEFECTIVE"
          icon={<Gauge className="h-4 w-4" />}
          accent="warn"
          tag={
            stats.total === 0 ? (
              <Badge tone="neutral">No data</Badge>
            ) : (
              <Badge tone="demo">Demo statistic</Badge>
            )
          }
        />
      </div>

      {/* Analytics + readiness */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Inspection analytics"
            subtitle="Normal vs defective results over the last 14 days"
            icon={<BarChart3 className="h-4 w-4" />}
            action={<Badge tone="demo">Demo timeline</Badge>}
          />
          <div className="h-[286px] w-full px-2 pb-4 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="normalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="defectFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.09)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} interval={1} dy={6} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={44} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(148,163,184,0.25)' }} />
                <Area
                  type="monotone"
                  dataKey="normal"
                  name="Normal"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#normalFill)"
                />
                <Area
                  type="monotone"
                  dataKey="defective"
                  name="Defective"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fill="url(#defectFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-aqua" /> Normal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Defective
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              avg score {formatScore(stats.averageScore)} · avg {formatDuration(stats.averageTime)}
            </span>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Inspection stack"
            subtitle="What runs today vs. what the backend will provide"
            icon={<Cpu className="h-4 w-4" />}
          />
          <div className="space-y-2.5 p-5">
            {readiness.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <span className="text-[12.5px] text-slate-300">{item.label}</span>
                {item.state === 'ready' ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> Ready
                  </span>
                ) : item.state === 'demo' ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-amber-300">
                    <Activity className="h-3.5 w-3.5" /> Demos
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    <CircleSlash className="h-3.5 w-3.5" /> Backend
                  </span>
                )}
              </div>
            ))}
            <Link
              to="/model"
              className="mt-1 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-500/[0.06] px-3 py-2.5 text-[12.5px] font-medium text-brand-200 transition hover:border-brand-400/40 hover:bg-brand-500/[0.1]"
            >
              Review the research workflow
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* Recent activity + side cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="overflow-hidden xl:col-span-2">
          <PanelHeader
            title="Recent inspection activity"
            subtitle="Latest records stored in this browser"
            icon={<History className="h-4 w-4" />}
            action={
              <Link to="/history" className="text-xs font-medium text-brand-300 hover:text-aqua">
                View all →
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={<ScanSearch className="h-5 w-5" />}
              title="No inspections recorded yet"
              description="Run your first inspection to populate analytics, history and reports."
              action={
                <Link
                  to="/inspect"
                  className="mt-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-aqua-500 px-4 py-2 text-xs font-semibold text-[#04121f]"
                >
                  Start inspection
                </Link>
              }
            />
          ) : (
            <>
              <div className="hidden sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-5 py-2.5 font-medium">Inspection</th>
                      <th className="px-3 py-2.5 font-medium">Category</th>
                      <th className="px-3 py-2.5 font-medium">Result</th>
                      <th className="px-3 py-2.5 text-right font-medium">Score</th>
                      <th className="px-5 py-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-3">
                          <p className="font-mono text-[12px] text-white">{record.id}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(record.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-300">{record.category}</td>
                        <td className="px-3 py-3">
                          <StatusPill status={record.status} />
                        </td>
                        <td className="tabular px-3 py-3 text-right font-mono text-[12px] text-slate-300">
                          {formatScore(record.anomalyScore)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            to={`/inspections/${record.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-aqua"
                          >
                            Details
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-white/[0.05] sm:hidden">
                {recent.map((record) => (
                  <Link
                    key={record.id}
                    to={`/inspections/${record.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11.5px] text-white">{record.id}</p>
                      <p className="text-[11px] text-slate-500">
                        {record.category} · {formatScore(record.anomalyScore)}
                      </p>
                    </div>
                    <StatusPill status={record.status} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              title="Reference dataset"
              subtitle="Visual Anomaly (VisA)"
              icon={<Database className="h-4 w-4" />}
            />
            <div className="p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mono-label">Total images</p>
                  <p className="tabular mt-1 font-mono text-2xl font-semibold text-white">
                    {formatNumber(VISA_DATASET.totalImages)}
                  </p>
                </div>
                <Badge tone="info">{VISA_DATASET.subsets} subsets</Badge>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Normal</span>
                    <span className="tabular font-mono text-slate-300">
                      {formatNumber(VISA_DATASET.normalImages)}
                    </span>
                  </div>
                  <ProgressBar value={VISA_DATASET.normalImages / VISA_DATASET.totalImages} tone="good" />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Anomalous</span>
                    <span className="tabular font-mono text-slate-300">
                      {formatNumber(VISA_DATASET.anomalousImages)}
                    </span>
                  </div>
                  <ProgressBar value={VISA_DATASET.anomalousImages / VISA_DATASET.totalImages} tone="bad" />
                </div>
              </div>
              <Link
                to="/dataset"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-aqua"
              >
                Explore subsets
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Inspections by category"
              subtitle="Top subsets in local records"
              icon={<Boxes className="h-4 w-4" />}
            />
            <div className="h-[196px] w-full px-2 pb-3 pt-4">
              {categoryData.length === 0 ? (
                <EmptyState title="No category data yet" description="Run an inspection to see distribution." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={86}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10.5 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                    <Bar dataKey="count" name="Inspections" radius={[0, 4, 4, 0]} barSize={11}>
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={index === 0 ? '#2f7bff' : 'rgba(47,123,255,0.45)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
