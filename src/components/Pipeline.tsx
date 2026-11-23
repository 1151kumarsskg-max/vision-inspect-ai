import {
  Boxes,
  ChevronRight,
  Gauge,
  Grid2x2,
  Image as ImageIcon,
  Layers,
  Scissors,
  SlidersHorizontal,
  Sprout,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { label: 'Input Image', detail: 'RGB capture', icon: ImageIcon },
  { label: 'Preprocessing', detail: 'Resize · normalize', icon: SlidersHorizontal },
  { label: 'Deep Feature Extraction', detail: 'Patch descriptors', icon: Layers },
  { label: 'Normal Feature Modelling', detail: 'Memory bank', icon: Boxes },
  { label: 'Anomaly Scoring', detail: 'Feature distance', icon: Gauge },
  { label: 'Thresholding', detail: 'Binary labels', icon: Scissors },
  { label: 'Seeded Region Growing', detail: 'Region merging', icon: Sprout },
  { label: 'Final Defect Mask', detail: 'Segmentation', icon: Grid2x2 },
];

export default function Pipeline({ activeIndex, compact = false }: { activeIndex?: number; compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-stretch gap-y-3">
      {STAGES.map((stage, index) => {
        const isActive = activeIndex === index;
        const isPast = typeof activeIndex === 'number' && index < activeIndex;
        return (
          <div key={stage.label} className="flex items-stretch">
            <div
              className={cn(
                'flex min-w-[142px] flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-300',
                isActive
                  ? 'border-aqua/50 bg-aqua/[0.08] shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                  : isPast
                    ? 'border-emerald-500/25 bg-emerald-500/[0.05]'
                    : 'border-white/[0.07] bg-white/[0.02]',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                  isActive
                    ? 'border-aqua/40 bg-aqua/15 text-aqua'
                    : isPast
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/[0.03] text-slate-500',
                )}
              >
                <stage.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="block truncate text-[11.5px] font-medium leading-tight text-slate-200">
                  {stage.label}
                </span>
                {!compact ? (
                  <span className="block truncate text-[10px] leading-tight text-slate-600">
                    {stage.detail}
                  </span>
                ) : null}
              </span>
            </div>
            {index < STAGES.length - 1 ? (
              <div className="hidden items-center px-1 xl:flex">
                <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
