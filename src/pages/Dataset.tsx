import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Boxes,
  CircleCheck,
  Database,
  FileStack,
  Grid3x3,
  Image as ImageIcon,
  Info,
  Layers,
  ShieldAlert,
  Target,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Badge,
  DemoBadge,
  InfoNote,
  Panel,
  PanelHeader,
  ProgressBar,
  StatCard,
} from '@/components/ui';
import { VISA_DATASET, VISA_SUBSETS } from '@/types';
import { formatNumber } from '@/lib/utils';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(8,17,31,0.96)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  fontSize: 12,
  color: '#e2e8f0',
};

const groupTone: Record<string, string> = {
  'Complex structure': 'text-brand-200 border-brand-500/25 bg-brand-500/10',
  'Multiple instances': 'text-aqua border-aqua/25 bg-aqua/10',
  'Single instance': 'text-amber-200 border-amber-400/25 bg-amber-400/10',
};

export default function Dataset() {
  const [selected, setSelected] = useState(VISA_SUBSETS[0].key);

  const splitData = [
    { name: 'Normal', value: VISA_DATASET.normalImages, color: '#22d3ee' },
    { name: 'Anomalous', value: VISA_DATASET.anomalousImages, color: '#fb7185' },
  ];

  const subsetData = VISA_SUBSETS.map((subset) => ({
    name: subset.name,
    Normal: subset.normalImages,
    Anomalous: subset.anomalousImages,
    total: subset.normalImages + subset.anomalousImages,
  }));

  const active = VISA_SUBSETS.find((subset) => subset.key === selected) ?? VISA_SUBSETS[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="info">
              <Database className="h-3 w-3" />
              Reference dataset
            </Badge>
            <Badge tone="neutral">amazon-science/spot-diff</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
            Visual Anomaly (VisA) dataset
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-400">
            {VISA_DATASET.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://github.com/amazon-science/spot-diff"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200 transition hover:bg-white/[0.08]"
          >
            <Layers className="h-4 w-4" />
            Repository
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://arxiv.org/abs/2207.14315"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200 transition hover:bg-white/[0.08]"
          >
            <FileStack className="h-4 w-4" />
            Paper
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total images"
          value={formatNumber(VISA_DATASET.totalImages)}
          hint="Across all 12 object subsets"
          icon={<ImageIcon className="h-4 w-4" />}
          accent="brand"
        />
        <StatCard
          label="Normal images"
          value={formatNumber(VISA_DATASET.normalImages)}
          hint={`${((VISA_DATASET.normalImages / VISA_DATASET.totalImages) * 100).toFixed(1)}% of the dataset`}
          icon={<CircleCheck className="h-4 w-4" />}
          accent="good"
        />
        <StatCard
          label="Anomalous images"
          value={formatNumber(VISA_DATASET.anomalousImages)}
          hint="Each carries a pixel-level mask"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="bad"
        />
        <StatCard
          label="Object subsets"
          value={formatNumber(VISA_DATASET.subsets)}
          hint="4 PCB · 4 multi-instance · 4 single-instance"
          icon={<Boxes className="h-4 w-4" />}
          accent="warn"
        />
      </div>

      <InfoNote tone="warn" icon={<Info className="h-4 w-4" />}>
        <span className="font-semibold text-amber-200">VisA is an evaluation dataset, not a model.</span>{' '}
        It supplies normal images, defective images and pixel-level ground-truth masks used to train and
        score anomaly detectors. Nothing on this page performs inference.
      </InfoNote>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Images per subset"
            subtitle="Normal vs anomalous samples in each VisA category"
            icon={<Grid3x3 className="h-4 w-4" />}
          />
          <div className="h-[420px] w-full px-2 pb-4 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subsetData} layout="vertical" margin={{ top: 0, right: 18, bottom: 0, left: 10 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
                <Bar dataKey="Normal" stackId="a" fill="#22d3ee" radius={[0, 0, 0, 0]} barSize={13} />
                <Bar dataKey="Anomalous" stackId="a" fill="#fb7185" radius={[0, 4, 4, 0]} barSize={13} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 border-t border-white/[0.06] px-5 py-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-aqua" /> Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Anomalous
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
              source: VisA paper, table 1
            </span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              title="Class balance"
              subtitle="Normal vs anomalous split"
              icon={<Target className="h-4 w-4" />}
            />
            <div className="relative h-[236px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={splitData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {splitData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xl font-semibold text-white">
                  {formatNumber(VISA_DATASET.totalImages)}
                </span>
                <span className="mono-label mt-0.5">images</span>
              </div>
            </div>
            <div className="space-y-2 px-5 pb-5">
              {splitData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-[11.5px]">
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="tabular font-mono text-slate-200">
                    {formatNumber(entry.value)} · {((entry.value / VISA_DATASET.totalImages) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Dataset contents"
              subtitle="What the reference set provides"
              icon={<FileStack className="h-4 w-4" />}
            />
            <ul className="space-y-2.5 p-5 text-[12px] leading-relaxed text-slate-400">
              <li className="flex gap-2">
                <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                Normal product images for unsupervised feature learning.
              </li>
              <li className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                Defective product images with surface and structural flaws.
              </li>
              <li className="flex gap-2">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aqua" />
                Pixel-level ground-truth segmentation masks for anomalous samples.
              </li>
              <li className="flex gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                {VISA_DATASET.imageResolution} · {VISA_DATASET.license}
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHeader
          title="Object subsets"
          subtitle="Select a category to inspect its split — categories match the inspection dropdown"
          icon={<Boxes className="h-4 w-4" />}
          action={<Badge tone="neutral">12 subsets</Badge>}
        />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {VISA_SUBSETS.map((subset) => {
            const isActive = subset.key === active.key;
            const total = subset.normalImages + subset.anomalousImages;
            return (
              <button
                key={subset.key}
                type="button"
                onClick={() => setSelected(subset.key)}
                className={`group rounded-xl border p-3.5 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-aqua/40 bg-aqua/[0.06] shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-white">{subset.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-600">{subset.folder}/</p>
                  </div>
                  <span className="rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 font-mono text-[9.5px] text-slate-400">
                    {formatNumber(total)}
                  </span>
                </div>
                <span
                  className={`mt-2.5 inline-flex rounded-md border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.08em] ${groupTone[subset.group]}`}
                >
                  {subset.group}
                </span>
                <div className="mt-3 flex items-center justify-between font-mono text-[10.5px]">
                  <span className="text-aqua/90">{formatNumber(subset.normalImages)} N</span>
                  <span className="text-rose-300/90">{formatNumber(subset.anomalousImages)} A</span>
                </div>
                <ProgressBar
                  value={subset.normalImages / total}
                  tone="brand"
                  className="mt-2 h-1"
                />
                <p className="mt-2 text-[10.5px] text-slate-500">
                  {subset.anomalyClasses} anomaly classes
                </p>
              </button>
            );
          })}
        </div>

        <div className="mx-5 mb-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mono-label">Selected subset</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {active.name}{' '}
                <span className="font-normal text-slate-500">· {active.group}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-4 font-mono text-[11px] text-slate-400">
              <span>
                normal <span className="text-white">{formatNumber(active.normalImages)}</span>
              </span>
              <span>
                anomalous <span className="text-white">{formatNumber(active.anomalousImages)}</span>
              </span>
              <span>
                anomaly classes <span className="text-white">{active.anomalyClasses}</span>
              </span>
              <span>
                split{' '}
                <span className="text-white">
                  {((active.normalImages / (active.normalImages + active.anomalousImages)) * 100).toFixed(1)}%
                  / {((active.anomalousImages / (active.normalImages + active.anomalousImages)) * 100).toFixed(1)}%
                </span>
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DemoBadge label="Category used by demo workstation" />
            <Link
              to="/inspect"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-200 hover:bg-white/[0.08]"
            >
              Inspect a {active.name} sample
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </Panel>

      <InfoNote>
        Figures follow Table 1 of the SPot-the-Difference paper: PCB1–4 (1,004 / 1,001 / 1,006 / 1,005 normal
        + 100 anomalous each), Capsules 602, Candles and Macaroni1/2 1,000 each, Cashew 500, Chewing gum 503,
        Fryum and Pipe fryum 500 — totalling 10,821 images (9,621 normal · 1,200 anomalous).
      </InfoNote>
    </div>
  );
}
