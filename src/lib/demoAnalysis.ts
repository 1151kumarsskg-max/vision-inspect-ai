import type { ProductCategory } from '@/types';

export interface DemoAnalysisOptions {
  category: ProductCategory;
  threshold: number;
  /** Output width cap in pixels; keeps localStorage payloads small. */
  maxEdge?: number;
}

export interface DemoAnalysisResult {
  images: {
    original: string;
    heatmap: string;
    threshold: string;
    mask: string;
  };
  status: 'NORMAL' | 'DEFECTIVE';
  anomalyScore: number;
  threshold: number;
  regions: Array<{
    id: number;
    label: string;
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
    confidence: number;
  }>;
  processingTimeMs: number;
  imageWidth: number;
  imageHeight: number;
}

export interface ConvertedMaskComparison {
  pixelAgreement: number;
  iou: number;
  precision: number;
  recall: number;
  predictedPixels: number;
  groundTruthPixels: number;
}

const DEFAULT_MAX_EDGE = 880;

const DEFECT_LABELS = [
  'Scratch',
  'Dent',
  'Crack',
  'Colour spot',
  'Surface irregularity',
  'Structural damage',
  'Missing component',
];

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random helpers                                 */
/* ------------------------------------------------------------------ */

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Image helpers                                                       */
/* ------------------------------------------------------------------ */

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The selected file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be decoded.'));
    image.src = src;
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Colour mapping                                                      */
/* ------------------------------------------------------------------ */

const COLOR_STOPS: Array<[number, [number, number, number]]> = [
  [0.0, [6, 16, 34]],
  [0.25, [16, 62, 150]],
  [0.5, [22, 178, 214]],
  [0.68, [42, 221, 196]],
  [0.82, [245, 196, 55]],
  [0.92, [249, 115, 22]],
  [1.0, [239, 68, 68]],
];

function heatColor(value: number): [number, number, number] {
  const t = Math.min(1, Math.max(0, value));
  for (let i = 1; i < COLOR_STOPS.length; i += 1) {
    const [pos, color] = COLOR_STOPS[i];
    const [prevPos, prevColor] = COLOR_STOPS[i - 1];
    if (t <= pos) {
      const span = pos - prevPos || 1;
      const mix = (t - prevPos) / span;
      return [
        prevColor[0] + (color[0] - prevColor[0]) * mix,
        prevColor[1] + (color[1] - prevColor[1]) * mix,
        prevColor[2] + (color[2] - prevColor[2]) * mix,
      ];
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1][1];
}

/* ------------------------------------------------------------------ */
/* Demo analysis                                                       */
/* ------------------------------------------------------------------ */

interface HeatSource {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  peak: number;
  phase: number;
  label: string;
}

/**
 * Produces clearly-labelled DEMO visualisations entirely in the browser.
 * No neural network, dataset inference or backend call is involved.
 */
export async function runDemoAnalysis(
  file: File,
  options: DemoAnalysisOptions,
): Promise<DemoAnalysisResult> {
  const started = performance.now();
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;

  const originalSource = await readFileAsDataUrl(file);
  const image = await loadImageElement(originalSource);

  const naturalWidth = image.naturalWidth || 1024;
  const naturalHeight = image.naturalHeight || 768;
  const scale = Math.min(1, maxEdge / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(2, Math.round(naturalWidth * scale));
  const height = Math.max(2, Math.round(naturalHeight * scale));

  const sourceCanvas = createCanvas(width, height);
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('Canvas 2D is unavailable in this browser.');
  sourceCtx.drawImage(image, 0, 0, width, height);
  const sourceData = sourceCtx.getImageData(0, 0, width, height);
  const sourcePixels = sourceData.data;

  const rng = mulberry32(hashString(`${file.name}|${file.size}|${options.category}`));
  const defective = rng() > 0.4;
  const candidateSpots: Array<[number, number]> = [
    [0.27, 0.3],
    [0.68, 0.34],
    [0.42, 0.68],
    [0.74, 0.66],
    [0.52, 0.5],
  ];
  const spotOffset = Math.floor(rng() * candidateSpots.length);
  const heatSources: HeatSource[] = [];

  const sourceCount = defective ? 1 + Math.floor(rng() * 3) : rng() > 0.55 ? 1 : 0;
  for (let i = 0; i < sourceCount; i += 1) {
    const spot = candidateSpots[(spotOffset + i) % candidateSpots.length];
    const jitterX = (rng() - 0.5) * 0.1;
    const jitterY = (rng() - 0.5) * 0.1;
    heatSources.push({
      cx: (spot[0] + jitterX) * width,
      cy: (spot[1] + jitterY) * height,
      rx: (0.075 + rng() * 0.075) * width,
      ry: (0.06 + rng() * 0.075) * height,
      peak: defective ? 0.78 + rng() * 0.21 : 0.24 + rng() * 0.28,
      phase: rng() * Math.PI * 2,
      label: DEFECT_LABELS[Math.floor(rng() * DEFECT_LABELS.length)],
    });
  }

  // Heat field: union of organic elliptical Gaussians.
  const heat = new Float32Array(width * height);
  let maxHeat = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = 0;
      for (const source of heatSources) {
        const dx = (x - source.cx) / source.rx;
        const dy = (y - source.cy) / source.ry;
        const d2 = dx * dx + dy * dy;
        if (d2 > 5) continue;
        const angle = Math.atan2(dy, dx);
        const wobble =
          1 + 0.16 * Math.sin(3 * angle + source.phase) + 0.09 * Math.sin(5 * angle - source.phase * 2);
        const v = source.peak * Math.exp(-d2 * Math.max(0.35, wobble) * 0.5);
        if (v > value) value = v;
      }
      heat[y * width + x] = value;
      if (value > maxHeat) maxHeat = value;
    }
  }

  const threshold = options.threshold;

  /* ---------------- Anomaly heatmap ---------------- */
  const heatCanvas = createCanvas(width, height);
  const heatCtx = heatCanvas.getContext('2d');
  if (!heatCtx) throw new Error('Canvas 2D is unavailable in this browser.');
  const heatImage = heatCtx.createImageData(width, height);
  const heatOut = heatImage.data;
  for (let i = 0; i < heat.length; i += 1) {
    const offset = i * 4;
    const luminance =
      sourcePixels[offset] * 0.299 + sourcePixels[offset + 1] * 0.587 + sourcePixels[offset + 2] * 0.114;
    const mono = luminance * 0.42 + 10;
    const value = heat[i];
    const alpha = Math.min(0.94, Math.max(0, (value - 0.08) / 0.82));
    const [r, g, b] = heatColor(value);
    heatOut[offset] = mono * (1 - alpha) + r * alpha;
    heatOut[offset + 1] = mono * (1 - alpha) + g * alpha;
    heatOut[offset + 2] = mono * (1 - alpha) + b * alpha;
    heatOut[offset + 3] = 255;
  }
  heatCtx.putImageData(heatImage, 0, 0);

  /* ---------------- Thresholded anomaly map ---------------- */
  const thresholdCanvas = createCanvas(width, height);
  const thresholdCtx = thresholdCanvas.getContext('2d');
  if (!thresholdCtx) throw new Error('Canvas 2D is unavailable in this browser.');
  const thresholdImage = thresholdCtx.createImageData(width, height);
  const thresholdOut = thresholdImage.data;
  for (let i = 0; i < heat.length; i += 1) {
    const offset = i * 4;
    const value = heat[i];
    const luminance =
      sourcePixels[offset] * 0.299 + sourcePixels[offset + 1] * 0.587 + sourcePixels[offset + 2] * 0.114;
    const base = luminance * 0.16 + 8;
    if (value >= threshold) {
      const [r, g, b] = heatColor(value);
      thresholdOut[offset] = r;
      thresholdOut[offset + 1] = g;
      thresholdOut[offset + 2] = b;
    } else {
      thresholdOut[offset] = base;
      thresholdOut[offset + 1] = base + 4;
      thresholdOut[offset + 2] = base + 12;
    }
    thresholdOut[offset + 3] = 255;
  }
  thresholdCtx.putImageData(thresholdImage, 0, 0);

  /* ---------------- Final segmented defect mask ---------------- */
  const maskCanvas = createCanvas(width, height);
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Canvas 2D is unavailable in this browser.');
  const maskImage = maskCtx.createImageData(width, height);
  const maskOut = maskImage.data;
  for (let i = 0; i < heat.length; i += 1) {
    const offset = i * 4;
    const value = heat[i];
    if (value >= threshold) {
      const intensity = Math.min(1, (value - threshold) / Math.max(0.0001, 1 - threshold));
      maskOut[offset] = 120 + 135 * intensity;
      maskOut[offset + 1] = 226 - 60 * intensity;
      maskOut[offset + 2] = 255 - 30 * intensity;
    } else {
      maskOut[offset] = 7;
      maskOut[offset + 1] = 12;
      maskOut[offset + 2] = 22;
    }
    maskOut[offset + 3] = 255;
  }
  maskCtx.putImageData(maskImage, 0, 0);

  /* ---------------- Region extraction ---------------- */
  const detected = heatSources.filter((source) => source.peak >= threshold);
  const regions = detected.map((source, index) => {
    const xPct = Math.max(0, Math.min(100, (source.cx / width) * 100));
    const yPct = Math.max(0, Math.min(100, (source.cy / height) * 100));
    return {
      id: index + 1,
      label: source.label,
      xPct: Math.round(xPct * 10) / 10,
      yPct: Math.round(yPct * 10) / 10,
      widthPct: Math.round(Math.min(100, ((source.rx * 2.3) / width) * 100) * 10) / 10,
      heightPct: Math.round(Math.min(100, ((source.ry * 2.3) / height) * 100) * 10) / 10,
      confidence: Math.min(0.98, 0.55 + source.peak * 0.4),
    };
  });

  if (regions.length > 0) {
    maskCtx.save();
    maskCtx.font = '600 13px "JetBrains Mono", monospace';
    maskCtx.textBaseline = 'middle';
    for (const region of regions) {
      const boxW = (region.widthPct / 100) * width;
      const boxH = (region.heightPct / 100) * height;
      const boxX = (region.xPct / 100) * width - boxW / 2;
      const boxY = (region.yPct / 100) * height - boxH / 2;
      maskCtx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
      maskCtx.lineWidth = 1.5;
      maskCtx.setLineDash([6, 4]);
      maskCtx.strokeRect(boxX, boxY, boxW, boxH);
      maskCtx.setLineDash([]);
      const label = `${region.id}`;
      const labelW = maskCtx.measureText(label).width + 10;
      maskCtx.fillStyle = 'rgba(8, 12, 22, 0.85)';
      maskCtx.fillRect(boxX, boxY - 20, labelW, 18);
      maskCtx.strokeRect(boxX, boxY - 20, labelW, 18);
      maskCtx.fillStyle = '#fbbf24';
      maskCtx.fillText(label, boxX + 5, boxY - 10);
    }
    maskCtx.restore();
  }

  const anomalyScore = Math.min(
    0.99,
    Math.max(0.02, maxHeat * (regions.length > 0 ? 0.98 : 0.6)),
  );

  const processingTimeMs = performance.now() - started;

  return {
    images: {
      original: originalSource,
      heatmap: heatCanvas.toDataURL('image/jpeg', 0.85),
      threshold: thresholdCanvas.toDataURL('image/png'),
      mask: maskCanvas.toDataURL('image/png'),
    },
    status: regions.length > 0 ? 'DEFECTIVE' : 'NORMAL',
    anomalyScore: Math.round(anomalyScore * 1000) / 1000,
    threshold,
    regions,
    processingTimeMs,
    imageWidth: width,
    imageHeight: height,
  };
}

/* ------------------------------------------------------------------ */
/* Ground-truth mask comparison                                        */
/* ------------------------------------------------------------------ */

const COMPARISON_EDGE = 320;

async function maskToBinary(src: string): Promise<{ pixels: Uint8Array; width: number; height: number }> {
  const image = await loadImageElement(src);
  const scale = Math.min(1, COMPARISON_EDGE / Math.max(image.naturalWidth, image.naturalHeight, 1));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < binary.length; i += 1) {
    const offset = i * 4;
    const alpha = data[offset + 3];
    const luminance = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
    binary[i] = alpha > 16 && luminance > 110 ? 1 : 0;
  }
  return { pixels: binary, width, height };
}

/**
 * Compare the demo mask with an operator-supplied VisA ground-truth mask.
 * Results are illustrative only: the demo mask is not model output.
 */
export async function compareMasks(
  predictedMask: string,
  groundTruthMask: string,
): Promise<ConvertedMaskComparison> {
  const predicted = await maskToBinary(predictedMask);
  const truth = await maskToBinary(groundTruthMask);

  // Resample both into a shared 256 × 256 grid so differing aspect ratios are comparable.
  const grid = 256;
  const predictedGrid = resample(predicted, grid);
  const truthGrid = resample(truth, grid);

  let intersection = 0;
  let predictedCount = 0;
  let truthCount = 0;
  for (let i = 0; i < predictedGrid.length; i += 1) {
    const p = predictedGrid[i];
    const t = truthGrid[i];
    if (p) predictedCount += 1;
    if (t) truthCount += 1;
    if (p && t) intersection += 1;
  }

  const union = predictedCount + truthCount - intersection;
  const iou = union > 0 ? intersection / union : 0;

  return {
    pixelAgreement: 1 - (predictedCount + truthCount - 2 * intersection) / (grid * grid),
    iou,
    precision: predictedCount > 0 ? intersection / predictedCount : 0,
    recall: truthCount > 0 ? intersection / truthCount : 0,
    predictedPixels: predictedCount,
    groundTruthPixels: truthCount,
  };
}

function resample(
  source: { pixels: Uint8Array; width: number; height: number },
  size: number,
): Uint8Array {
  const out = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = Math.min(source.width - 1, Math.floor((x / size) * source.width));
      const sy = Math.min(source.height - 1, Math.floor((y / size) * source.height));
      out[y * size + x] = source.pixels[sy * source.width + sx];
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Sample workstation asset                                            */
/* ------------------------------------------------------------------ */

/** Draw a synthetic PCB-like board so the upload flow can be demonstrated offline. */
export async function createSampleInspectionImage(): Promise<File> {
  const width = 900;
  const height = 640;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');

  const board = ctx.createLinearGradient(0, 0, width, height);
  board.addColorStop(0, '#0f3b30');
  board.addColorStop(1, '#0a2b23');
  ctx.fillStyle = board;
  ctx.fillRect(0, 0, width, height);

  // Copper traces
  ctx.strokeStyle = 'rgba(196, 148, 74, 0.55)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 22; i += 1) {
    const y = 40 + i * 26;
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(300 + ((i * 37) % 180), y);
    ctx.lineTo(340 + ((i * 41) % 160), y + 24);
    ctx.lineTo(820, y + 24);
    ctx.stroke();
  }

  // Pads
  ctx.fillStyle = 'rgba(212, 178, 116, 0.8)';
  for (let i = 0; i < 26; i += 1) {
    const x = 70 + ((i * 71) % 760);
    const y = 60 + ((i * 47) % 500);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central IC
  ctx.fillStyle = '#0b1219';
  ctx.strokeStyle = 'rgba(148, 190, 210, 0.5)';
  ctx.lineWidth = 2;
  ctx.fillRect(330, 240, 240, 170);
  ctx.strokeRect(330, 240, 240, 170);
  ctx.fillStyle = 'rgba(160, 200, 220, 0.35)';
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(340 + i * 28, 222, 12, 16);
    ctx.fillRect(340 + i * 28, 412, 12, 16);
  }

  // Silkscreen labels
  ctx.fillStyle = 'rgba(226, 240, 248, 0.55)';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText('VISION-INSPECT / DEMO BOARD', 60, 610);
  ctx.fillText('REV A', 760, 610);

  // Sensor grain
  const grain = ctx.getImageData(0, 0, width, height);
  const rng = mulberry32(hashString('sample-board-grain'));
  for (let i = 0; i < grain.data.length; i += 4) {
    const noise = (rng() - 0.5) * 12;
    grain.data[i] = Math.max(0, Math.min(255, grain.data[i] + noise));
    grain.data[i + 1] = Math.max(0, Math.min(255, grain.data[i + 1] + noise));
    grain.data[i + 2] = Math.max(0, Math.min(255, grain.data[i + 2] + noise));
  }
  ctx.putImageData(grain, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) throw new Error('Could not generate the sample image.');
  return new File([blob], 'visa-pcb1-sample.jpg', { type: 'image/jpeg' });
}
