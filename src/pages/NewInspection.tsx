import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  FileImage,
  Hash,
  Info,
  Loader2,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from 'lucide-react';
import ImageDropzone, { validateImageFile } from '@/components/ImageDropzone';
import Pipeline from '@/components/Pipeline';
import {
  Badge,
  Button,
  DemoBadge,
  Field,
  InfoNote,
  Panel,
  PanelHeader,
} from '@/components/ui';
import { PRODUCT_CATEGORIES, subsetForCategory, type Inspection, type ProductCategory } from '@/types';
import { loadSettings, upsertInspection } from '@/lib/storage';
import {
  compareMasks,
  createSampleInspectionImage,
  readFileAsDataUrl,
  runDemoAnalysis,
} from '@/lib/demoAnalysis';
import { formatNumber, generateInspectionId } from '@/lib/utils';

const ANALYSIS_STEPS = [
  'Preprocessing image (resize · normalise)',
  'Building demo anomaly field',
  'Modelling normal appearance',
  'Scoring anomaly response',
  'Thresholding + region growing',
  'Rendering heatmap and mask',
];

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

export default function NewInspection() {
  const navigate = useNavigate();
  const settings = useMemo(() => loadSettings(), []);
  const [file, setFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [category, setCategory] = useState<ProductCategory>(settings.defaultCategory);
  const [inspectionId, setInspectionId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [maskError, setMaskError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [sampleLoading, setSampleLoading] = useState(false);
  const timersRef = useRef<number[]>([]);

  const previewUrl = useObjectUrl(file);
  const maskPreviewUrl = useObjectUrl(maskFile);
  const subset = subsetForCategory(category);
  const suggestedId = useMemo(() => generateInspectionId(), []);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const handleAnalysis = async () => {
    if (!file) {
      setAnalysisError('Select an inspection image before running the analysis.');
      return;
    }
    setAnalysisError(null);
    setBusy(true);
    setStage(0);
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = ANALYSIS_STEPS.map((_, index) =>
      window.setTimeout(() => setStage(index), index * 240),
    );

    const started = performance.now();
    try {
      const result = await runDemoAnalysis(file, {
        category,
        threshold: settings.anomalyThreshold,
      });

      let groundTruthMask: string | null = null;
      let maskComparison = null;
      if (maskFile) {
        groundTruthMask = await readFileAsDataUrl(maskFile);
        maskComparison = await compareMasks(result.images.mask, groundTruthMask);
      }

      const record: Inspection = {
        id: inspectionId.trim() || suggestedId,
        category,
        createdAt: new Date().toISOString(),
        status: result.status,
        anomalyScore: result.anomalyScore,
        threshold: result.threshold,
        processingTimeMs: result.processingTimeMs,
        regionCount: result.regions.length,
        regions: result.regions,
        imageName: file.name,
        images: result.images,
        groundTruthMask,
        maskComparison,
        source: 'demo-analysis',
        notes: notes.trim() || undefined,
      };

      // Keep the progress animation legible even when rendering is instant.
      const elapsed = performance.now() - started;
      if (elapsed < 1250) {
        await new Promise((resolve) => window.setTimeout(resolve, 1250 - elapsed));
      }

      upsertInspection(record);
      navigate(`/inspections/${record.id}`);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : 'The analysis could not be completed.',
      );
    } finally {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
      setBusy(false);
    }
  };

  const loadSample = async () => {
    setSampleLoading(true);
    setUploadError(null);
    try {
      const sample = await createSampleInspectionImage();
      setFile(sample);
      setCategory('PCB1');
    } catch {
      setUploadError('The sample image could not be generated in this browser.');
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="info">
              <ScanSearch className="h-3 w-3" />
              Workstation
            </Badge>
            <DemoBadge label="Demo analysis" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">New inspection</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
            Load a part image, choose the VisA category it belongs to, and run the inspection. Results are
            generated locally for demonstration until the FastAPI model service is connected.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
          View inspection history
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Left column */}
        <div className="space-y-5">
          <Panel>
            <PanelHeader
              title="Image acquisition"
              subtitle="Drag & drop or browse for the part to inspect"
              icon={<FileImage className="h-4 w-4" />}
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  loading={sampleLoading}
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                  onClick={loadSample}
                  disabled={busy}
                >
                  Load sample
                </Button>
              }
            />
            <div className="space-y-4 p-5">
              <ImageDropzone
                previewUrl={previewUrl}
                fileName={file?.name}
                onSelect={setFile}
                onRemove={() => {
                  setFile(null);
                  setUploadError(null);
                }}
                onError={setUploadError}
                disabled={busy}
              />
              {uploadError ? (
                <p className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.07] px-3 py-2 text-xs text-rose-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {uploadError}
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Product category"
                  htmlFor="category"
                  required
                  hint={subset ? `VisA · ${subset.group}` : undefined}
                >
                  <div className="relative">
                    <Database className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <select
                      id="category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as ProductCategory)}
                      disabled={busy}
                      className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0a1526] pl-9 pr-9 text-sm text-white outline-none transition focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
                    >
                      {PRODUCT_CATEGORIES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                      ▾
                    </span>
                  </div>
                </Field>

                <Field label="Inspection ID" htmlFor="inspection-id" hint="Optional">
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="inspection-id"
                      value={inspectionId}
                      onChange={(event) => setInspectionId(event.target.value)}
                      placeholder={suggestedId}
                      disabled={busy}
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#0a1526] pl-9 pr-3 font-mono text-[13px] text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </Field>
              </div>

              <Field label="Operator notes" htmlFor="notes" hint="Optional">
                <input
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Line 4 · batch 2211 · first-off inspection"
                  disabled={busy}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0a1526] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Ground-truth mask"
              subtitle="Optional · compare the demo mask against a VisA pixel-level annotation"
              icon={<Target className="h-4 w-4" />}
              action={<Badge tone="neutral">Optional</Badge>}
            />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[160px_1fr] sm:items-start">
              {maskPreviewUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black">
                  <img src={maskPreviewUrl} alt="Ground-truth mask" className="h-[110px] w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setMaskFile(null)}
                    className="absolute right-1.5 top-1.5 rounded-md bg-black/70 p-1.5 text-rose-300 hover:bg-black/90"
                    aria-label="Remove ground-truth mask"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-[110px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/12 bg-white/[0.02] text-center">
                  <Target className="h-5 w-5 text-slate-600" />
                  <span className="text-[11px] text-slate-500">No mask loaded</span>
                </div>
              )}
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.08]">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    className="hidden"
                    disabled={busy}
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      event.target.value = '';
                      if (!selected) return;
                      const error = validateImageFile(selected);
                      if (error) {
                        setMaskError(error);
                        return;
                      }
                      setMaskError(null);
                      setMaskFile(selected);
                    }}
                  />
                  <FileImage className="h-3.5 w-3.5" />
                  Upload mask image
                </label>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  VisA ships binary PNG masks for anomalous images. When supplied, the results page reports
                  pixel agreement, IoU, precision and recall against the demo mask — clearly labelled as a
                  demo comparison.
                </p>
                {maskError ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-rose-300">
                    <AlertTriangle className="h-3 w-3" />
                    {maskError}
                  </p>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Processing pipeline"
              subtitle="Architecture the frontend is designed against"
              icon={<Cpu className="h-4 w-4" />}
              action={<Badge tone="demo">Simulated locally</Badge>}
            />
            <div className="p-5">
              <Pipeline activeIndex={busy ? stage : undefined} />
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Panel className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/50 to-transparent" />
            <PanelHeader
              title="Run inspection"
              subtitle="Configuration is applied to this run only"
              icon={<Wand2 className="h-4 w-4" />}
            />
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="mono-label">Selected category</span>
                  <span className="font-mono text-xs text-aqua">{category}</span>
                </div>
                {subset ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-slate-500">Normal images</p>
                      <p className="tabular font-mono text-slate-200">{formatNumber(subset.normalImages)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Anomalous images</p>
                      <p className="tabular font-mono text-slate-200">{formatNumber(subset.anomalousImages)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Anomaly classes</p>
                      <p className="tabular font-mono text-slate-200">{subset.anomalyClasses}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Object type</p>
                      <p className="text-slate-200">{subset.group}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs">
                <span className="text-slate-400">Decision threshold</span>
                <span className="font-mono text-slate-200">{settings.anomalyThreshold.toFixed(2)}</span>
              </div>

              {analysisError ? (
                <p className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.07] px-3 py-2 text-xs text-rose-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {analysisError}
                </p>
              ) : null}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={busy}
                onClick={handleAnalysis}
                disabled={!file || busy}
                icon={<ScanSearch className="h-4 w-4" />}
              >
                {busy ? 'Analysing image…' : 'Analyse image'}
              </Button>
              {!file ? (
                <p className="text-center text-[11px] text-slate-500">
                  Upload an image to enable the analysis.
                </p>
              ) : null}

              {busy ? (
                <div className="space-y-2 rounded-xl border border-aqua/20 bg-aqua/[0.04] p-3">
                  {ANALYSIS_STEPS.map((label, index) => {
                    const done = index < stage;
                    const active = index === stage;
                    return (
                      <div key={label} className="flex items-center gap-2 text-[11px]">
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-aqua" />
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full border border-white/15" />
                        )}
                        <span className={done ? 'text-slate-400' : active ? 'text-aqua' : 'text-slate-600'}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Panel>

          <InfoNote tone="warn" icon={<ShieldAlert className="h-4 w-4" />}>
            This build does not perform real inference. The heatmap, threshold map and mask are generated
            deterministically in the browser from the uploaded image so the interface can be evaluated end
            to end. They are never presented as model predictions.
          </InfoNote>

          <Panel>
            <PanelHeader
              title="Workstation notes"
              subtitle="Operator guidance"
              icon={<Info className="h-4 w-4" />}
            />
            <ul className="space-y-2.5 p-5 text-[12px] leading-relaxed text-slate-400">
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-aqua" />
                Use a single-object, well-lit capture — the same framing used for normal reference images.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-aqua" />
                Supported formats: JPG, JPEG and PNG up to 8 MB. Images never leave the browser.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-aqua" />
                Ground-truth masks are only available for anomalous VisA samples; normal samples have none.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-aqua" />
                Records are saved to localStorage; the newest four keep their imagery.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
