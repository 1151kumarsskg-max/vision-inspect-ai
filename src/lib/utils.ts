export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatScore(value: number): string {
  return value.toFixed(3);
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function dayKey(iso: string): string {
  const date = new Date(iso);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function regionLocation(region: { xPct: number; yPct: number }): string {
  const horizontal = region.xPct < 34 ? 'Left' : region.xPct > 66 ? 'Right' : 'Center';
  const vertical = region.yPct < 34 ? 'upper' : region.yPct > 66 ? 'lower' : 'middle';
  return `${vertical} ${horizontal.toLowerCase()} region`;
}

const ID_ALPHABET = '0123456789';

export function generateInspectionId(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}`.slice(2) + `${now.getMonth() + 1}`.padStart(2, '0');
  let tail = '';
  for (let i = 0; i < 4; i += 1) {
    tail += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return `VI-${stamp}-${tail}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
