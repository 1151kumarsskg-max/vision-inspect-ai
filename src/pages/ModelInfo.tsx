import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  CircleDashed,
  Cpu,
  Database,
  Gauge,
  Grid2x2,
  Layers,
  Network,
  Scissors,
  ShieldAlert,
  Sprout,
  Target,
} from 'lucide-react';
import Pipeline from '@/components/Pipeline';
import {
  Badge,
  DemoBadge,
  InfoNote,
  Panel,
  PanelHeader,
} from '@/components/ui';

const WORKFLOW = [
  {
    icon: Database,
    title: 'Unsupervised normal feature learning',
    body: 'Only normal product images are used for training. No defect labels, masks or class names are supplied, so the model learns what “normal” looks like for each category.',
  },
  {
    icon: Layers,
    title: 'Deep feature extraction',
    body: 'A pretrained backbone (ResNet-style patch descriptors, or the SPot-the-Difference pretrained weights) turns each image into a grid of local embeddings capturing texture, edge and colour structure.',
  },
  {
    icon: Boxes,
    title: 'Memory bank & feature-space comparison',
    body: 'Normal patch embeddings from the training set are stored in a memory bank. At inference, each test patch is compared with its nearest normal neighbours; large distances indicate unusual appearance.',
  },
  {
    icon: Gauge,
    title: 'Anomaly heatmap generation',
    body: 'Patch-level distances are upsampled and smoothed into a dense anomaly map with the same resolution as the input image — the heatmap operators review.',
  },
  {
    icon: Scissors,
    title: 'Threshold-based segmentation',
    body: 'A decision threshold (global or per-category, calibrated from normal validation scores) converts the continuous map into binary anomalous / normal labels.',
  },
  {
    icon: Sprout,
    title: 'Seeded region growing',
    body: 'High-confidence pixels seed regions that grow into connected neighbourhoods, suppressing isolated noise pixels and merging fragmented responses into coherent defect areas.',
  },
  {
    icon: Grid2x2,
    title: 'Binary defect mask generation',
    body: 'Each grown region is measured — area, centroid, bounding box, mean score — and rasterised into the final defect mask used for reporting and ground-truth comparison.',
  },
];

const IMPLEMENTED = [
  { label: 'VisA category selection (12 subsets)', done: true },
  { label: 'Image upload, preview, replace, remove', done: true },
  { label: 'Inspection ID, notes, operator settings', done: true },
  { label: 'Original / heatmap / threshold / mask panels', done: true },
  { label: 'Ground-truth mask comparison (IoU, precision, recall)', done: true },
  { label: 'History persistence + PDF report generation', done: true },
  { label: 'Deep feature extraction & memory bank', done: false },
  { label: 'Model inference, thresholds and scoring', done: false },
  { label: 'Seeded region growing on real model output', done: false },
  { label: 'Server-side report + dataset index endpoints', done: false },
];

export default function ModelInfo() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="info">
              <Cpu className="h-3 w-3" />
              Research workflow
            </Badge>
            <DemoBadge label="No inference yet" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Model information</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-400">
            How the inspection stack is designed to work: learn normal appearance, measure deviation, then
            segment the deviation into a defect mask. Everything described here is the target architecture
            for the Python backend — not something this frontend currently executes.
          </p>
        </div>
      </div>

      <InfoNote tone="warn" icon={<ShieldAlert className="h-4 w-4" />}>
        <span className="font-semibold text-amber-200">Reference only.</span> The Amazon{' '}
        <a
          href="https://github.com/amazon-science/spot-diff"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted hover:text-white"
        >
          SPot-the-Difference
        </a>{' '}
        repository is the research reference for this project and the source of the VisA dataset. It is not
        integrated as an inference service, and no model weights are loaded by this application.
      </InfoNote>

      <Panel>
        <PanelHeader
          title="End-to-end pipeline"
          subtitle="Input → preprocessing → features → modelling → scoring → thresholding → region growing → mask"
          icon={<Network className="h-4 w-4" />}
        />
        <div className="p-5">
          <Pipeline />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {WORKFLOW.map((step, index) => (
          <div
            key={step.title}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-panel/70 p-5 transition-colors hover:border-white/15"
          >
            <div className="absolute right-4 top-4 font-mono text-[42px] font-bold leading-none text-white/[0.04]">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/10 text-brand-300">
                <step.icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{step.body}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-400/15 bg-amber-400/[0.03] p-5">
          <div>
            <Badge tone="demo">Honest boundary</Badge>
            <h3 className="mt-3 text-sm font-semibold text-white">What the demo actually does</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">
              The current build derives a deterministic heat field from the uploaded image in the browser,
              then renders a heatmap, threshold map and mask from it. Anomaly scores are computed from that
              field, not from a learned normal-appearance model. Every such output is labelled{' '}
              <span className="font-mono text-[11px] text-amber-200">DEMO</span>.
            </p>
          </div>
          <a
            href="https://github.com/amazon-science/spot-diff"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 hover:text-aqua"
          >
            Read the reference implementation
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Implemented in this frontend"
            subtitle="Interface, flow and local state — the backend contract is prepared"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <ul className="divide-y divide-white/[0.05]">
            {IMPLEMENTED.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-[12.5px] text-slate-300">{item.label}</span>
                {item.done ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Done
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    <CircleDashed className="h-3.5 w-3.5" /> Backend
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              title="Backend integration points"
              subtitle="FastAPI routes already modelled in src/lib/api.ts"
              icon={<Target className="h-4 w-4" />}
            />
            <div className="space-y-2 p-5">
              {[
                ['POST', '/api/inspections', 'Upload image + category'],
                ['POST', '/api/inspections/{id}/analyze', 'Run anomaly detection'],
                ['GET', '/api/inspections/{id}/heatmap', 'Retrieve heatmap PNG'],
                ['GET', '/api/inspections/{id}/mask', 'Retrieve segmentation mask'],
                ['GET', '/api/inspections/{id}/report', 'Retrieve PDF report'],
                ['GET', '/health', 'Readiness probe'],
              ].map(([method, path, description]) => (
                <div
                  key={path}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded border border-brand-500/25 bg-brand-500/10 px-1.5 py-0.5 font-mono text-[9.5px] text-brand-200">
                      {method}
                    </span>
                    <code className="truncate font-mono text-[11px] text-slate-300">{path}</code>
                  </div>
                  <span className="text-[10.5px] text-slate-500">{description}</span>
                </div>
              ))}
              <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
                These routes are placeholders: the service does not exist yet, so no request is sent during
                a demo run.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="References"
              subtitle="Project background"
              icon={<BookOpen className="h-4 w-4" />}
            />
            <div className="space-y-3 p-5 text-[12px]">
              <a
                href="https://github.com/amazon-science/spot-diff"
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-brand-400/40 hover:bg-white/[0.04]"
              >
                <p className="font-medium text-white">amazon-science/spot-diff</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Reference repository and VisA dataset release.
                </p>
              </a>
              <a
                href="https://arxiv.org/abs/2207.14315"
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-brand-400/40 hover:bg-white/[0.04]"
              >
                <p className="font-medium text-white">
                  SPot-the-Difference Self-Supervised Pre-training for Anomaly Detection and Segmentation
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">Zou et al. · ECCV 2022</p>
              </a>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
