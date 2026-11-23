import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  HardDrive,
  Loader2,
  RotateCcw,
  Save,
  Server,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  InfoNote,
  Panel,
  PanelHeader,
} from '@/components/ui';
import { PRODUCT_CATEGORIES, type AppSettings, type ProductCategory } from '@/types';
import {
  clearInspections,
  isStorageAvailable,
  loadInspections,
  loadSettings,
  saveSettings,
} from '@/lib/storage';
import { checkBackendHealth, DEFAULT_API_BASE_URL, type BackendHealth } from '@/lib/api';

export default function SettingsPage() {
  const [initial] = useState<AppSettings>(() => loadSettings());
  const [form, setForm] = useState<AppSettings>(initial);
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [testing, setTesting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [recordCount, setRecordCount] = useState(() => loadInspections().length);
  const storageAvailable = isStorageAvailable();

  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || saved;

  const handleSave = () => {
    const normalized: AppSettings = {
      ...form,
      apiBaseUrl: form.apiBaseUrl.trim() || DEFAULT_API_BASE_URL,
    };
    saveSettings(normalized);
    setForm(normalized);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleTest = async () => {
    setTesting(true);
    setHealth(null);
    const result = await checkBackendHealth();
    setHealth(result);
    setTesting(false);
  };

  const handleReset = () => {
    setForm({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      anomalyThreshold: 0.6,
      defaultCategory: 'PCB1',
      retainImageHistory: true,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Badge tone="info">
            <SlidersHorizontal className="h-3 w-3" />
            Configuration
          </Badge>
          <Badge tone="demo">Local only</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
          Operator defaults and the API endpoint that will host the FastAPI inspection service.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel>
            <PanelHeader
              title="Inspection defaults"
              subtitle="Applied to every new inspection in this browser"
              icon={<Gauge className="h-4 w-4" />}
            />
            <div className="space-y-5 p-5">
              <Field
                label="Anomaly decision threshold"
                htmlFor="threshold"
                hint={`${form.anomalyThreshold.toFixed(2)} · higher = fewer flags`}
              >
                <div className="rounded-xl border border-white/[0.08] bg-[#0a1526] px-4 py-3.5">
                  <input
                    id="threshold"
                    type="range"
                    min={0.2}
                    max={0.95}
                    step={0.01}
                    value={form.anomalyThreshold}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, anomalyThreshold: Number(event.target.value) }))
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-emerald-500/50 via-amber-400/60 to-rose-500/70 accent-aqua"
                  />
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-600">
                    <span>0.20 sensitive</span>
                    <span className="text-aqua">{form.anomalyThreshold.toFixed(2)}</span>
                    <span>0.95 strict</span>
                  </div>
                </div>
              </Field>

              <Field label="Default VisA category" htmlFor="default-category">
                <select
                  id="default-category"
                  value={form.defaultCategory}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      defaultCategory: event.target.value as ProductCategory,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0a1526] px-3 text-sm text-white outline-none focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="API base URL" htmlFor="api-url" hint="FastAPI service">
                <div className="relative">
                  <Server className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="api-url"
                    value={form.apiBaseUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, apiBaseUrl: event.target.value }))}
                    placeholder={DEFAULT_API_BASE_URL}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0a1526] pl-9 pr-3 font-mono text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <input
                  type="checkbox"
                  checked={form.retainImageHistory}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, retainImageHistory: event.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent accent-brand-500"
                />
                <span>
                  <span className="block text-[12.5px] font-medium text-slate-200">
                    Retain imagery in local history
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    The newest four records keep their heatmaps and masks; older entries keep summary data only.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={handleSave}>
                  Save settings
                </Button>
                <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={handleReset}>
                  Restore defaults
                </Button>
                {saved ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved to this browser
                  </span>
                ) : dirty ? (
                  <span className="text-xs text-amber-300/80">Unsaved changes</span>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Backend connection"
              subtitle="Probe the future FastAPI service"
              icon={<Activity className="h-4 w-4" />}
              action={
                health ? (
                  <Badge tone={health.reachable ? 'good' : 'bad'}>
                    {health.reachable ? 'Reachable' : 'Offline'}
                  </Badge>
                ) : null
              }
            />
            <div className="space-y-3 p-5">
              <InfoNote tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
                No inference backend ships with this build. The test sends a real request to the configured
                URL and reports exactly what happens — it does not simulate a connection.
              </InfoNote>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handleTest}
                  loading={testing}
                  icon={<Activity className="h-4 w-4" />}
                >
                  Test connection
                </Button>
                <code className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-slate-400">
                  GET {form.apiBaseUrl.replace(/\/$/, '')}/health
                </code>
              </div>
              {testing ? (
                <p className="flex items-center gap-2 text-[11.5px] text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for a response…
                </p>
              ) : health ? (
                <div
                  className={`rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed ${
                    health.reachable
                      ? 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-100'
                      : 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100'
                  }`}
                >
                  <p className="font-medium">{health.reachable ? 'Backend reachable' : 'Backend unreachable'}</p>
                  <p className="mt-1 opacity-80">{health.message}</p>
                  {health.latencyMs !== undefined ? (
                    <p className="mt-1 font-mono text-[10.5px] opacity-70">latency {health.latencyMs} ms</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader
              title="Local storage"
              subtitle="Everything is persisted in this browser"
              icon={<HardDrive className="h-4 w-4" />}
            />
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <span className="text-[12px] text-slate-400">Stored inspections</span>
                <span className="font-mono text-sm text-white">{recordCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <span className="text-[12px] text-slate-400">localStorage available</span>
                <Badge tone={storageAvailable ? 'good' : 'bad'}>
                  {storageAvailable ? 'Yes' : 'Blocked'}
                </Badge>
              </div>
              {!storageAvailable ? (
                <InfoNote tone="warn">
                  This browser blocks localStorage, so history will not persist between reloads.
                </InfoNote>
              ) : null}
              <Button
                variant="danger"
                className="w-full"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => setClearOpen(true)}
                disabled={recordCount === 0}
              >
                Clear inspection history
              </Button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Environment"
              subtitle="Build information"
              icon={<Database className="h-4 w-4" />}
            />
            <dl className="divide-y divide-white/[0.05] text-[12px]">
              {[
                ['Application', 'VISION INSPECT AI'],
                ['Version', '1.0.0 · frontend demo'],
                ['Inference', 'Not connected'],
                ['Dataset', 'VisA · 10,821 images'],
                ['Research reference', 'amazon-science/spot-diff'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-mono text-[11.5px] text-slate-300">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={clearOpen}
        title="Clear inspection history?"
        description="All locally stored inspection records and images will be deleted from this browser."
        confirmLabel="Clear history"
        onConfirm={() => {
          clearInspections();
          setRecordCount(0);
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}
