/** The 12 VisA object categories (amazon-science/spot-diff). */
export const PRODUCT_CATEGORIES = [
  'PCB1',
  'PCB2',
  'PCB3',
  'PCB4',
  'Capsules',
  'Candles',
  'Macaroni1',
  'Macaroni2',
  'Cashew',
  'Chewing gum',
  'Fryum',
  'Pipe fryum',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type InspectionStatus = 'NORMAL' | 'DEFECTIVE';

/** Where a record came from. Nothing in this build is produced by a trained model. */
export type InspectionSource = 'demo-seed' | 'demo-analysis';

export interface AnomalyRegion {
  id: number;
  label: string;
  /** Region centre + size in percent of image dimensions. */
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  confidence: number;
}

export interface InspectionImages {
  original: string;
  heatmap: string;
  threshold: string;
  mask: string;
}

export interface MaskComparison {
  /** Share of pixels the demo prediction and the supplied ground truth agree on. */
  pixelAgreement: number;
  iou: number;
  precision: number;
  recall: number;
  predictedPixels: number;
  groundTruthPixels: number;
}

export interface Inspection {
  id: string;
  category: ProductCategory;
  createdAt: string;
  status: InspectionStatus;
  /** 0..1 anomaly score produced by the (demo) scoring step. */
  anomalyScore: number;
  /** 0..1 decision threshold used for segmentation. */
  threshold: number;
  processingTimeMs: number;
  regionCount: number;
  regions: AnomalyRegion[];
  imageName: string;
  images: InspectionImages | null;
  /** Optional VisA pixel-level ground-truth mask supplied by the operator. */
  groundTruthMask?: string | null;
  maskComparison?: MaskComparison | null;
  source: InspectionSource;
  notes?: string;
}

export interface AppSettings {
  apiBaseUrl: string;
  anomalyThreshold: number;
  defaultCategory: ProductCategory;
  retainImageHistory: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: 'http://localhost:8000',
  anomalyThreshold: 0.6,
  defaultCategory: 'PCB1',
  retainImageHistory: true,
};

/**
 * VisA dataset metadata. Normal / anomaly image counts and anomaly class counts
 * are taken from Table 1 of the SPot-the-Difference paper (ECCV 2022), which is
 * the dataset released in the amazon-science/spot-diff repository.
 */
export interface DatasetSubset {
  key: string;
  name: ProductCategory;
  folder: string;
  group: 'Complex structure' | 'Multiple instances' | 'Single instance';
  normalImages: number;
  anomalousImages: number;
  anomalyClasses: number;
}

export const VISA_SUBSETS: DatasetSubset[] = [
  { key: 'pcb1', name: 'PCB1', folder: 'pcb1', group: 'Complex structure', normalImages: 1004, anomalousImages: 100, anomalyClasses: 4 },
  { key: 'pcb2', name: 'PCB2', folder: 'pcb2', group: 'Complex structure', normalImages: 1001, anomalousImages: 100, anomalyClasses: 4 },
  { key: 'pcb3', name: 'PCB3', folder: 'pcb3', group: 'Complex structure', normalImages: 1006, anomalousImages: 100, anomalyClasses: 4 },
  { key: 'pcb4', name: 'PCB4', folder: 'pcb4', group: 'Complex structure', normalImages: 1005, anomalousImages: 100, anomalyClasses: 7 },
  { key: 'capsules', name: 'Capsules', folder: 'capsules', group: 'Multiple instances', normalImages: 602, anomalousImages: 100, anomalyClasses: 5 },
  { key: 'candle', name: 'Candles', folder: 'candle', group: 'Multiple instances', normalImages: 1000, anomalousImages: 100, anomalyClasses: 8 },
  { key: 'macaroni1', name: 'Macaroni1', folder: 'macaroni1', group: 'Multiple instances', normalImages: 1000, anomalousImages: 100, anomalyClasses: 7 },
  { key: 'macaroni2', name: 'Macaroni2', folder: 'macaroni2', group: 'Multiple instances', normalImages: 1000, anomalousImages: 100, anomalyClasses: 7 },
  { key: 'cashew', name: 'Cashew', folder: 'cashew', group: 'Single instance', normalImages: 500, anomalousImages: 100, anomalyClasses: 9 },
  { key: 'chewinggum', name: 'Chewing gum', folder: 'chewinggum', group: 'Single instance', normalImages: 503, anomalousImages: 100, anomalyClasses: 6 },
  { key: 'fryum', name: 'Fryum', folder: 'fryum', group: 'Single instance', normalImages: 500, anomalousImages: 100, anomalyClasses: 8 },
  { key: 'pipe_fryum', name: 'Pipe fryum', folder: 'pipe_fryum', group: 'Single instance', normalImages: 500, anomalousImages: 100, anomalyClasses: 6 },
];

export const VISA_DATASET = {
  name: 'Visual Anomaly (VisA)',
  repository: 'amazon-science/spot-diff',
  paper: 'SPot-the-Difference Self-Supervised Pre-training for Anomaly Detection and Segmentation (ECCV 2022)',
  subsets: 12,
  totalImages: 10821,
  normalImages: 9621,
  anomalousImages: 1200,
  imageResolution: '4,000 × 6,000 RGB sensor',
  license: 'CC BY 4.0 (research use)',
  description:
    'Normal product images, defective product images and pixel-level ground-truth segmentation masks for 12 object categories. The dataset is an evaluation resource — it is not an inference model.',
} as const;

export function subsetForCategory(category: ProductCategory): DatasetSubset | undefined {
  return VISA_SUBSETS.find((subset) => subset.name === category);
}
