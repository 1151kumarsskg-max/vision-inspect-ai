import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, Info, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InspectionStatus } from '@/types';

/* ------------------------------------------------------------------ */
/* Panel                                                              */
/* ------------------------------------------------------------------ */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('panel', className)}>{children}</section>;
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 text-brand-300">{icon}</div> : null}
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-500 to-aqua-500 text-[#04121f] font-semibold shadow-[0_10px_30px_-16px_rgba(34,211,238,0.9)] hover:from-brand-400 hover:to-aqua-400',
  secondary:
    'bg-white/[0.06] text-slate-100 border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/20',
  ghost: 'text-slate-400 hover:text-white hover:bg-white/[0.06]',
  danger:
    'bg-rose-500/10 text-rose-300 border border-rose-500/25 hover:bg-rose-500/20 hover:text-rose-200',
  outline:
    'border border-brand-500/40 text-brand-200 hover:bg-brand-500/10 hover:border-brand-400/60',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2.5',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Badges + status                                                    */
/* ------------------------------------------------------------------ */

type BadgeTone = 'neutral' | 'good' | 'bad' | 'warn' | 'info' | 'demo';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-white/[0.06] text-slate-300 border-white/10',
  good: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  bad: 'bg-rose-500/12 text-rose-300 border-rose-500/25',
  warn: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
  info: 'bg-brand-500/12 text-brand-200 border-brand-500/25',
  demo: 'bg-amber-400/[0.08] text-amber-200/90 border-amber-400/25',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status, className }: { status: InspectionStatus; className?: string }) {
  const good = status === 'NORMAL';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
        good
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        className,
      )}
    >
      <span
        className={cn(
          'relative flex h-1.5 w-1.5 rounded-full',
          good ? 'bg-emerald-400' : 'bg-rose-400',
        )}
      >
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-ping',
            good ? 'bg-emerald-400/60' : 'bg-rose-400/60',
          )}
        />
      </span>
      {status}
    </span>
  );
}

export function DemoBadge({ label = 'Demo output' }: { label?: string }) {
  return (
    <Badge tone="demo" className="gap-1">
      <ShieldCheck className="h-3 w-3" />
      {label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                          */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'brand',
  tag,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: 'brand' | 'good' | 'bad' | 'warn';
  tag?: ReactNode;
}) {
  const accents: Record<string, string> = {
    brand: 'from-brand-500/20 to-aqua-500/10 text-brand-300',
    good: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300',
    bad: 'from-rose-500/20 to-orange-500/5 text-rose-300',
    warn: 'from-amber-500/20 to-amber-500/5 text-amber-300',
  };
  return (
    <div className="panel group relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {icon ? (
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br',
              accents[accent],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="tabular mt-3 font-mono text-3xl font-semibold leading-none text-white">{value}</p>
      {hint ? <p className="mt-3 text-xs text-slate-500">{hint}</p> : null}
      {tag ? <div className="mt-3">{tag}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Metric row                                                          */
/* ------------------------------------------------------------------ */

export function MetricRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <p className="mono-label">{label}</p>
      <p className={cn('mt-1.5 text-sm font-semibold text-white', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                           */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  tone = 'brand',
  className,
}: {
  value: number;
  tone?: 'brand' | 'good' | 'bad' | 'warn';
  className?: string;
}) {
  const tones: Record<string, string> = {
    brand: 'from-brand-500 to-aqua-400',
    good: 'from-emerald-500 to-emerald-300',
    bad: 'from-rose-500 to-orange-400',
    warn: 'from-amber-500 to-amber-300',
  };
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-700', tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field + notes                                                      */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
          {label}
          {required ? <span className="ml-1 text-aqua">*</span> : null}
        </label>
        {hint ? <span className="text-[11px] text-slate-600">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function InfoNote({
  children,
  tone = 'info',
  icon,
  className,
}: {
  children: ReactNode;
  tone?: 'info' | 'warn' | 'good';
  icon?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-brand-500/20 bg-brand-500/[0.06] text-brand-100/90',
    warn: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-100/90',
    good: 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-100/90',
  };
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed',
        tones[tone],
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{icon ?? <Info className="h-4 w-4" />}</span>
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state + spinner                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-500">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        {description ? (
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

/* ------------------------------------------------------------------ */
/* Confirm dialog                                                     */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060d]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-2xl border border-white/10 bg-panel p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
