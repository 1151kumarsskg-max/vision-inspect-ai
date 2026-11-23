import type { DatasetSubset, Inspection, ProductCategory } from '@/types';
import { generateInspectionId } from '@/lib/utils';
import { VISA_SUBSETS } from '@/types';

const INSPECTIONS_KEY = 'visioninspect.inspections.v1';
const SETTINGS_KEY = 'visioninspect.settings.v1';
const SEED_KEY = 'visioninspect.seeded.v1';

export { SETTINGS_KEY };

/** Local demo storage is small; only the newest records keep their image data. */
const MAX_RECORDS_WITH_IMAGES = 4;

function canUseStorage(): boolean {
  try {
    const probe = '__vi_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && canUseStorage();
}

function readRaw(): Inspection[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(INSPECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Inspection[];
  } catch {
    return [];
  }
}

/** Persist records newest-first, silently dropping images from older entries. */
export function saveInspections(list: Inspection[]): Inspection[] {
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  let trimmed = sorted.map((record, index) =>
    index < MAX_RECORDS_WITH_IMAGES ? record : { ...record, images: null, groundTruthMask: null },
  );

  if (!isStorageAvailable()) return trimmed;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      window.localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(trimmed));
      return trimmed;
    } catch {
      // Quota exceeded — progressively drop heavy payloads, then retry.
      trimmed = trimmed.map((record, index) =>
        index < 1
          ? { ...record, images: null, groundTruthMask: null }
          : { ...record, images: null, groundTruthMask: null },
      );
    }
  }
  return trimmed;
}

export function loadInspections(): Inspection[] {
  return readRaw().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getInspection(id: string): Inspection | undefined {
  return loadInspections().find((record) => record.id === id);
}

export function upsertInspection(record: Inspection): Inspection[] {
  const existing = loadInspections().filter((item) => item.id !== record.id);
  return saveInspections([record, ...existing]);
}

export function deleteInspection(id: string): Inspection[] {
  return saveInspections(loadInspections().filter((item) => item.id !== id));
}

export function clearInspections(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(INSPECTIONS_KEY);
    window.localStorage.removeItem(SEED_KEY);
  } catch {
    /* ignore */
  }
}

export function loadSettings(): import('@/types').AppSettings {
  const fallback: import('@/types').AppSettings = {
    apiBaseUrl: 'http://localhost:8000',
    anomalyThreshold: 0.6,
    defaultCategory: 'PCB1',
    retainImageHistory: true,
  };
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<typeof fallback>) };
  } catch {
    return fallback;
  }
}

export function saveSettings(settings: import('@/types').AppSettings): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

interface SeedSpec {
  category: ProductCategory;
  status: Inspection['status'];
  score: number;
  regions: number;
  hoursAgo: number;
}

const SEED_SPECS: SeedSpec[] = [
  { category: 'PCB1', status: 'DEFECTIVE', score: 0.871, regions: 2, hoursAgo: 3 },
  { category: 'Capsules', status: 'NORMAL', score: 0.214, regions: 0, hoursAgo: 6 },
  { category: 'PCB3', status: 'DEFECTIVE', score: 0.734, regions: 1, hoursAgo: 21 },
  { category: 'Candles', status: 'NORMAL', score: 0.187, regions: 0, hoursAgo: 27 },
  { category: 'Macaroni1', status: 'DEFECTIVE', score: 0.652, regions: 1, hoursAgo: 45 },
  { category: 'Cashew', status: 'NORMAL', score: 0.263, regions: 0, hoursAgo: 52 },
  { category: 'Chewing gum', status: 'DEFECTIVE', score: 0.918, regions: 3, hoursAgo: 68 },
  { category: 'PCB2', status: 'NORMAL', score: 0.301, regions: 0, hoursAgo: 76 },
  { category: 'Fryum', status: 'DEFECTIVE', score: 0.689, regions: 1, hoursAgo: 94 },
  { category: 'PCB4', status: 'NORMAL', score: 0.242, regions: 0, hoursAgo: 110 },
  { category: 'Pipe fryum', status: 'DEFECTIVE', score: 0.812, regions: 2, hoursAgo: 121 },
  { category: 'Macaroni2', status: 'NORMAL', score: 0.156, regions: 0, hoursAgo: 143 },
  { category: 'Capsules', status: 'NORMAL', score: 0.279, regions: 0, hoursAgo: 168 },
  { category: 'PCB1', status: 'DEFECTIVE', score: 0.757, regions: 1, hoursAgo: 184 },
];

const LABELS = ['Scratch', 'Dent', 'Crack', 'Colour spot', 'Missing component'];
const LOCATIONS = [
  { xPct: 27, yPct: 36 },
  { xPct: 63, yPct: 58 },
  { xPct: 46, yPct: 71 },
];

function buildSeedRecord(spec: SeedSpec, index: number): Inspection {
  const subset: DatasetSubset | undefined = VISA_SUBSETS.find((item) => item.name === spec.category);
  return {
    id: generateInspectionId(),
    category: spec.category,
    createdAt: new Date(Date.now() - spec.hoursAgo * 60 * 60 * 1000).toISOString(),
    status: spec.status,
    anomalyScore: spec.score,
    threshold: 0.6,
    processingTimeMs: 820 + ((index * 137) % 460),
    regionCount: spec.regions,
    regions: Array.from({ length: spec.regions }, (_, regionIndex) => ({
      id: regionIndex + 1,
      label: LABELS[(index + regionIndex) % LABELS.length],
      xPct: LOCATIONS[regionIndex % LOCATIONS.length].xPct,
      yPct: LOCATIONS[regionIndex % LOCATIONS.length].yPct,
      widthPct: 16 + ((index * 3 + regionIndex * 5) % 12),
      heightPct: 12 + ((index * 2 + regionIndex * 4) % 10),
      confidence: Math.min(0.97, 0.52 + spec.score * 0.45),
    })),
    imageName: `${subset?.folder ?? 'sample'}-${index + 1}.jpg`,
    // Seeded history entries carry no imagery: they are summary records only.
    images: null,
    groundTruthMask: null,
    maskComparison: null,
    source: 'demo-seed',
    notes: 'Sample summary record created for interface demonstration. No model inference was run.',
  };
}

/** Populate the demo history once so the console is never empty on first load. */
export function seedDemoHistory(): Inspection[] {
  const existing = loadInspections();
  if (existing.length > 0) return existing;

  let alreadySeeded = false;
  if (isStorageAvailable()) {
    try {
      alreadySeeded = window.localStorage.getItem(SEED_KEY) === 'true';
    } catch {
      alreadySeeded = false;
    }
  }
  if (alreadySeeded) return existing;

  const saved = saveInspections(SEED_SPECS.map(buildSeedRecord));
  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(SEED_KEY, 'true');
    } catch {
      /* ignore */
    }
  }
  return saved;
}
