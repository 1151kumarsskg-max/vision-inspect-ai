import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Expand,
  FileWarning,
  Gauge,
  Layers,
  Maximize2,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  X,
} from 'lucide-react';
import Pipeline from '@/components/Pipeline';
import {
  Badge,
  Button,
  DemoBadge,
  EmptyState,
  InfoNote,
  MetricRow,
  Panel,
  PanelHeader,
  ProgressBar,
  StatusPill,
} from '@/components/ui';
import type { Inspection } from '@/types';
import { getInspection } from '@/lib/storage';
import { downloadInspectionReport } from '@/lib/report';
import {
  formatDateTime,
  formatDuration,
  formatPercent,
  formatScore,
  regionLocation,
} from '@/lib/utils';

function ImagePanel({
  step,
  title,
  subtitle,
  src,
  onExpand,
  accent = 'brand',
  emptyLabel = 'No image stored for this record',
}: {
  step: string;
  title: string;
  subtitle: string;
  src?: string | null;
  onExpand?: (src: string, label: string) => void;
  accent?: 'brand' | 'aqua' | 'good' | 'bad';
  emptyLabel?: string;
}) {
  const accents: Record<string, string> = {
    brand: 'text-brand-300 border-brand-500/25 bg-brand-500/10',
    aqua: 'text-aqua border-aqua/25 bg-aqua/10',
    good: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10',
    bad: 'text-rose-300 border-rose-500/25 bg-rose-500/10',
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#070f1c]">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-[11px] font-semibold ${accents[accent]}`}
          >
            {step}
          </span>
          <div>
            <p className="text-[12.5px] font-semibold leading-tight text-white">{title}</p>
            <p className="text-[10.5px] leading-tight text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DemoBadge />
          {src && onExpand ? (
            <button
              type="button"
              onClick={() => onExpand(src, title)}
              className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label={`Expand ${title}`}
            >
              <Expand className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="dot-grid relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#040810]">
        {src ? (
          <img src={src} alt={title} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <FileWarning className="h-6 w-6 text-slate-600" />
            <p className="text-[11.5px] leading-relaxed text-slate-500">{emptyLabel}</p>
          </div>
        )}
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-md border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-amber-200/90">
          Demo
        </span>
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'good' | 'bad';
}) {
  const tones = {
    neutral: 'text-slate-200',
    good: 'text-emerald-300',
    bad: 'text-rose-300',
  };
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="mono-label">{label}</span>
      </div>
      <p className={`tabular mt-2 font-mono text-lg font-semibold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 truncate text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null | undefined>(undefined);
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setInspection(null);
      return;
    }
    setInspection(getInspection(id) ?? null);
  }, [id]);

  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoom(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const scoreTone = inspection
    ? inspection.status === 'DEFECTIVE'
      ? 'bad'
      : 'good'
    : 'brand';

  const primaryLocation = useMemo(() => {
    if (!inspection || inspection.regions.length === 0) return 'No anomaly region';
    const region = inspection.regions[0];
    return `${regionLocation(region)} · x ${region.xPct.toFixed(0)}% / y ${region.yPct.toFixed(0)}%`;
  }, [inspection]);

  const handleReport = async () => {
    if (!inspection) return;
    setReporting(true);
    setReportError(null);
    try {
      await downloadInspectionReport(inspection);
    } catch {
      setReportError('The report could not be generated. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  if (inspection === undefined) {
    return (
      <Panel className="mt-8">
        <EmptyState
          icon={<ScanSearch className="h-5 w-5" />}
          title="Loading inspection record…"
          description="Reading the record from local storage."
        />
      </Panel>
    );
  }

  if (inspection === null) {
    return (
      <Panel className="mt-8">
        <EmptyState
          icon={<TriangleAlert className="h-5 w-5" />}
          title="Inspection not found"
          description="This record does not exist in local storage. It may have been deleted or created in another browser."
          action={
            <div className="mt-2 flex gap-2">
              <Link
                to="/history"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to history
              </Link>
              <Link
                to="/inspect"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-aqua-500 px-4 py-2 text-xs font-semibold text-[#04121f]"
              >
                <ScanSearch className="h-3.5 w-3.5" />
                New inspection
              </Link>
            </div>
          }
        />
      </Panel>
    );
  }

  const images = inspection.images;
  const isDemo = inspection.source === 'demo-analysis';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inspection history
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="info">
              <Layers className="h-3 w-3" />
              {inspection.category}
            </Badge>
            <DemoBadge label={isDemo ? 'Demo analysis' : 'Sample record'} />
            <span className="font-mono text-[11px] text-slate-500">{formatDateTime(inspection.createdAt)}</span>
          </div>
          <h1 className="mt-2.5 font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {inspection.id}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {inspection.imageName}
            {inspection.notes ? ` · ${inspection.notes}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            loading={reporting}
            onClick={handleReport}
          >
            Download report
          </Button>
          <Button
            variant="primary"
            icon={<ScanSearch className="h-4 w-4" />}
            onClick={() => navigate('/inspect')}
          >
            New inspection
          </Button>
        </div>
      </div>

      {reportError ? (
        <InfoNote tone="warn" icon={<TriangleAlert className="h-4 w-4" />}>
          {reportError}
        </InfoNote>
      ) : null}

      <InfoNote tone="warn" icon={<ShieldAlert className="h-4 w-4" />}>
        <span className="font-semibold text-amber-200">Demo results.</span> No trained model produced the
        outputs below. The heatmap, threshold map, mask and score are generated client-side so the workflow
        can be demonstrated; they must not be used for quality decisions.
      </InfoNote>

      {/* Status summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel className="relative overflow-hidden p-5">
          <div
            className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
              inspection.status === 'DEFECTIVE' ? 'via-rose-400/60' : 'via-emerald-400/60'
            } to-transparent`}
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mono-label">Inspection status</p>
              <div className="mt-2.5">
                <StatusPill status={inspection.status} className="px-3.5 py-1.5 text-xs" />
              </div>
            </div>
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                inspection.status === 'DEFECTIVE'
                  ? 'border-rose-500/25 bg-rose-500/10 text-rose-300'
                  : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {inspection.status === 'DEFECTIVE' ? (
                <TriangleAlert className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Anomaly score</span>
              <span className="tabular font-mono text-white">
                {formatScore(inspection.anomalyScore)} / 1.000
              </span>
            </div>
            <ProgressBar value={inspection.anomalyScore} tone={scoreTone} className="h-2" />
            <div className="flex justify-between font-mono text-[10px] text-slate-600">
              <span>0.00 normal</span>
              <span className="text-amber-300/80">threshold {inspection.threshold.toFixed(2)}</span>
              <span>1.00 anomalous</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            {inspection.status === 'DEFECTIVE'
              ? `${inspection.regionCount} anomaly region${inspection.regionCount === 1 ? '' : 's'} passed the decision threshold.`
              : 'All anomaly responses stayed below the decision threshold.'}
          </p>
        </Panel>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
          <MetricTile
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="Anomaly score"
            value={formatScore(inspection.anomalyScore)}
            hint={`threshold ${inspection.threshold.toFixed(2)}`}
            tone={inspection.status === 'DEFECTIVE' ? 'bad' : 'good'}
          />
          <MetricTile
            icon={<Target className="h-3.5 w-3.5" />}
            label="Defect location"
            value={
              inspection.regions.length > 0
                ? `${inspection.regions[0].xPct.toFixed(0)}% / ${inspection.regions[0].yPct.toFixed(0)}%`
                : '—'
            }
            hint={primaryLocation}
          />
          <MetricTile
            icon={<Timer className="h-3.5 w-3.5" />}
            label="Processing time"
            value={formatDuration(inspection.processingTimeMs)}
            hint="client-side demo rendering"
          />
          <MetricTile
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Anomaly regions"
            value={String(inspection.regionCount)}
            hint={inspection.regionCount > 0 ? 'connected defect areas' : 'none detected'}
          />
        </div>
      </div>

      {/* Four output panels */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Visual outputs</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
            A → D · generated in browser
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ImagePanel
            step="A"
            title="Original input image"
            subtitle="Uploaded part capture"
            src={images?.original}
            onExpand={(src, label) => setZoom({ src, label })}
            accent="brand"
            emptyLabel="Imagery was not retained for this record (older history entries keep summary data only)."
          />
          <ImagePanel
            step="B"
            title="Anomaly heatmap"
            subtitle="Demo anomaly response · blue → red"
            src={images?.heatmap}
            onExpand={(src, label) => setZoom({ src, label })}
            accent="aqua"
            emptyLabel="No heatmap stored — run a new inspection to generate a demo heatmap."
          />
          <ImagePanel
            step="C"
            title="Thresholded anomaly map"
            subtitle={`Pixels above threshold ${inspection.threshold.toFixed(2)}`}
            src={images?.threshold}
            onExpand={(src, label) => setZoom({ src, label })}
            accent="bad"
            emptyLabel="No threshold map stored for this record."
          />
          <ImagePanel
            step="D"
            title="Final segmented defect mask"
            subtitle="Binary defect regions after region growing"
            src={images?.mask}
            onExpand={(src, label) => setZoom({ src, label })}
            accent="good"
            emptyLabel="No segmentation mask stored for this record."
          />
        </div>
      </div>

      {/* Pipeline */}
      <Panel>
        <PanelHeader
          title="Processing pipeline"
          subtitle="Input → preprocessing → features → modelling → scoring → threshold → region growing → mask"
          icon={<Cpu className="h-4 w-4" />}
          action={<Badge tone="demo">Demo run</Badge>}
        />
        <div className="p-5">
          <Pipeline />
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            The demo run only visualises these stages. Deep feature extraction, memory-bank modelling and
            seeded region growing require the Python/FastAPI service and a trained model.
          </p>
        </div>
      </Panel>

      {/* Regions + ground truth */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Detected anomaly regions"
            subtitle="Region-level breakdown of the demo mask"
            icon={<Target className="h-4 w-4" />}
            action={<Badge tone="neutral">{inspection.regionCount} region(s)</Badge>}
          />
          {inspection.regions.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="No anomaly regions"
              description="The demo mask contains no connected region above the threshold."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-2.5 font-medium">#</th>
                    <th className="px-3 py-2.5 font-medium">Defect label</th>
                    <th className="px-3 py-2.5 font-medium">Location</th>
                    <th className="px-3 py-2.5 font-medium">Area</th>
                    <th className="px-5 py-2.5 text-right font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.regions.map((region) => (
                    <tr
                      key={region.id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3 font-mono text-[12px] text-slate-400">{region.id}</td>
                      <td className="px-3 py-3 text-slate-200">{region.label}</td>
                      <td className="px-3 py-3 text-[12px] text-slate-400">
                        {region.xPct.toFixed(1)}% / {region.yPct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 font-mono text-[11.5px] text-slate-400">
                        {region.widthPct.toFixed(1)} × {region.heightPct.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[12px] text-slate-200">
                        {formatPercent(region.confidence)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-white/[0.06] px-5 py-3">
            <Link
              to="/model"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-300 hover:text-aqua"
            >
              How regions are produced
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Ground-truth comparison"
            subtitle="VisA pixel-level annotation vs. the demo mask"
            icon={<Sparkles className="h-4 w-4" />}
            action={
              inspection.groundTruthMask ? <Badge tone="info">Mask supplied</Badge> : <Badge tone="neutral">Not supplied</Badge>
            }
          />
          {inspection.groundTruthMask && inspection.maskComparison ? (
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black">
                  <p className="border-b border-white/[0.06] px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-slate-500">
                    Ground truth
                  </p>
                  <img
                    src={inspection.groundTruthMask}
                    alt="Ground-truth defect mask"
                    className="h-[132px] w-full object-contain"
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black">
                  <p className="border-b border-white/[0.06] px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-slate-500">
                    Demo prediction
                  </p>
                  <img
                    src={images?.mask ?? ''}
                    alt="Demo predicted mask"
                    className="h-[132px] w-full object-contain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { label: 'Pixel agreement', value: inspection.maskComparison.pixelAgreement },
                  { label: 'IoU', value: inspection.maskComparison.iou },
                  { label: 'Precision', value: inspection.maskComparison.precision },
                  { label: 'Recall', value: inspection.maskComparison.recall },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <p className="mono-label">{metric.label}</p>
                    <p className="tabular mt-1 font-mono text-base font-semibold text-white">
                      {formatPercent(metric.value, 2)}
                    </p>
                    <ProgressBar value={metric.value} tone="brand" className="mt-2 h-1" />
                  </div>
                ))}
              </div>

              <InfoNote tone="warn">
                These numbers compare a browser-generated demo mask with the VisA annotation. They are not
                model evaluation metrics and must not be reported as such.
              </InfoNote>
            </div>
          ) : (
            <EmptyState
              icon={<Target className="h-5 w-5" />}
              title="No ground-truth mask for this record"
              description="Upload a VisA pixel-level mask on the inspection page to compare it with the demo segmentation."
              action={
                <Link
                  to="/inspect"
                  className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-200"
                >
                  Run inspection with a mask
                </Link>
              }
            />
          )}
        </Panel>
      </div>

      {/* Record metadata */}
      <Panel>
        <PanelHeader
          title="Record details"
          subtitle="Stored in this browser via localStorage"
          icon={<Clock className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4">
          <MetricRow label="Inspection ID" value={inspection.id} mono />
          <MetricRow label="Category" value={inspection.category} />
          <MetricRow label="Created" value={formatDateTime(inspection.createdAt)} />
          <MetricRow label="Result" value={inspection.status} />
          <MetricRow label="Anomaly score" value={formatScore(inspection.anomalyScore)} mono />
          <MetricRow label="Threshold" value={inspection.threshold.toFixed(2)} mono />
          <MetricRow label="Processing time" value={formatDuration(inspection.processingTimeMs)} mono />
          <MetricRow
            label="Source"
            value={inspection.source === 'demo-seed' ? 'Sample history' : 'Browser demo'}
          />
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Maximize2 className="h-3.5 w-3.5" />
          Report includes images, metrics and the demo disclaimer.
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="h-3.5 w-3.5" />}
          loading={reporting}
          onClick={handleReport}
        >
          Download PDF report
        </Button>
      </div>

      {zoom ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#02060d]/92 p-4 backdrop-blur-sm"
          onClick={() => setZoom(null)}
        >
          <div className="mb-3 flex w-full max-w-4xl items-center justify-between">
            <p className="text-sm font-medium text-white">{zoom.label}</p>
            <button
              type="button"
              className="rounded-lg border border-white/15 p-2 text-slate-300 hover:bg-white/10"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <img
            src={zoom.src}
            alt={zoom.label}
            className="max-h-[80vh] max-w-4xl rounded-xl border border-white/10 object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/80">
            Demo visualisation · not model output
          </p>
        </div>
      ) : null}
    </div>
  );
}
