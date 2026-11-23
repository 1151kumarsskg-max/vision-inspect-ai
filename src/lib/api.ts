/**
 * API service layer — prepared for a FastAPI backend.
 *
 * Nothing here is wired to a running service yet. Each function issues a real
 * HTTP request against the documented contract below, so pointing
 * VITE_API_BASE_URL at a deployed FastAPI instance is the only change required.
 *
 * Expected FastAPI contract
 * -------------------------
 * POST   /api/inspections                      multipart: image, category, inspection_id?
 * POST   /api/inspections/{id}/analyze         runs anomaly detection, returns scores + regions
 * GET    /api/inspections/{id}/heatmap         image/png anomaly heatmap
 * GET    /api/inspections/{id}/mask            image/png segmentation mask
 * GET    /api/inspections/{id}/report          application/pdf inspection report
 * GET    /health                               readiness probe
 *
 * The browser never runs inference in this build: the analysis screen uses
 * clearly labelled local demo visualisations until the backend exists.
 */

import type { Inspection, InspectionStatus, ProductCategory, InspectionImages, AnomalyRegion } from '@/types';

const ENV_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const DEFAULT_API_BASE_URL = ENV_BASE_URL || 'http://localhost:8000';

/** Read the operator-configured base URL, falling back to the build-time env value. */
export function resolveApiBaseUrl(): string {
  try {
    const raw = window.localStorage.getItem('visioninspect.settings.v1');
    if (raw) {
      const parsed = JSON.parse(raw) as { apiBaseUrl?: string };
      if (parsed.apiBaseUrl && parsed.apiBaseUrl.trim()) return parsed.apiBaseUrl.trim();
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_API_BASE_URL;
}

export class ApiError extends Error {
  status?: number;
  code: string;

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code ?? 'request_failed';
  }
}

export interface AnalyzeInspectionPayload {
  inspectionId: string;
  category: ProductCategory;
  image: File;
  threshold?: number;
}

export interface AnalyzeInspectionResponse {
  inspectionId: string;
  status: InspectionStatus;
  anomalyScore: number;
  threshold: number;
  processingTimeMs: number;
  regions: AnomalyRegion[];
  images: InspectionImages;
  createdAt: string;
}

export interface UploadInspectionResponse {
  inspectionId: string;
  receivedBytes: number;
  accepted: boolean;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const base = resolveApiBaseUrl().replace(/\/$/, '');
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, init);
  } catch (error) {
    throw new ApiError(
      `Could not reach the inspection backend at ${base}. Start the FastAPI service and confirm the base URL in Settings.`,
      { code: 'network_error' },
    );
  }
  if (!response.ok) {
    throw new ApiError(
      `Backend responded with ${response.status} ${response.statusText || ''}`.trim(),
      { status: response.status, code: 'http_error' },
    );
  }
  return response;
}

export async function uploadInspectionImage(payload: AnalyzeInspectionPayload): Promise<UploadInspectionResponse> {
  const form = new FormData();
  form.append('image', payload.image, payload.image.name);
  form.append('category', payload.category);
  form.append('inspection_id', payload.inspectionId);
  const response = await request('/api/inspections', { method: 'POST', body: form });
  const data = (await response.json()) as { inspection_id: string; received_bytes: number; accepted: boolean };
  return {
    inspectionId: data.inspection_id,
    receivedBytes: data.received_bytes,
    accepted: data.accepted,
  };
}

export async function runAnomalyDetection(
  inspectionId: string,
  threshold?: number,
): Promise<AnalyzeInspectionResponse> {
  const response = await request(`/api/inspections/${encodeURIComponent(inspectionId)}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threshold: threshold ?? null }),
  });
  return (await response.json()) as AnalyzeInspectionResponse;
}

async function fetchImageBlob(path: string): Promise<Blob> {
  const response = await request(path, { headers: { Accept: 'image/png' } });
  return response.blob();
}

/** Anomaly heatmap rendered by the backend (float map rendered to PNG). */
export async function retrieveAnomalyHeatmap(inspectionId: string): Promise<Blob> {
  return fetchImageBlob(`/api/inspections/${encodeURIComponent(inspectionId)}/heatmap`);
}

/** Binary defect mask after thresholding + seeded region growing. */
export async function retrieveSegmentationMask(inspectionId: string): Promise<Blob> {
  return fetchImageBlob(`/api/inspections/${encodeURIComponent(inspectionId)}/mask`);
}

/** PDF report assembled server-side from the stored inspection record. */
export async function retrieveInspectionReport(inspectionId: string): Promise<Blob> {
  const response = await request(`/api/inspections/${encodeURIComponent(inspectionId)}/report`, {
    headers: { Accept: 'application/pdf' },
  });
  return response.blob();
}

export async function fetchInspection(inspectionId: string): Promise<Inspection> {
  const response = await request(`/api/inspections/${encodeURIComponent(inspectionId)}`, {
    headers: { Accept: 'application/json' },
  });
  return (await response.json()) as Inspection;
}

export interface BackendHealth {
  reachable: boolean;
  modelLoaded?: boolean;
  message: string;
  latencyMs?: number;
}

/** Probe GET /health. Used by Settings → Connection test. */
export async function checkBackendHealth(): Promise<BackendHealth> {
  const started = performance.now();
  try {
    const response = await request('/health', { headers: { Accept: 'application/json' } });
    const body = (await response.json().catch(() => ({}))) as { model_loaded?: boolean; status?: string };
    return {
      reachable: true,
      modelLoaded: body.model_loaded,
      message: body.status ? `Backend status: ${body.status}` : 'Backend reachable.',
      latencyMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      reachable: false,
      message: error instanceof Error ? error.message : 'Backend unreachable.',
    };
  }
}
