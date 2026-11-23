import { jsPDF } from 'jspdf';
import type { Inspection } from '@/types';
import { formatDuration, formatDateTime } from '@/lib/utils';

const PAGE_W = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const NAVY: [number, number, number] = [8, 17, 31];

function loadAspect(src: string): Promise<number> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth / (image.naturalHeight || 1) || 1);
    image.onerror = () => resolve(4 / 3);
    image.src = src;
  });
}

function dataUrlFormat(src: string): 'JPEG' | 'PNG' {
  return src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

/**
 * Build a client-side PDF report from a stored inspection record.
 * The report carries an explicit demo disclaimer because no model was run.
 */
export async function downloadInspectionReport(inspection: Inspection): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let y = 0;

  /* Header band */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 32, 'F');
  doc.setFillColor(34, 211, 238);
  doc.rect(0, 32, PAGE_W, 0.9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('VISION INSPECT AI', MARGIN, 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(150, 205, 240);
  doc.text('AI-Powered Unsupervised Computer Vision for Manufacturing Defect Detection', MARGIN, 19.4);
  doc.setTextColor(110, 145, 175);
  doc.setFontSize(7.4);
  doc.text('Inspection report · generated in the browser from local demo data', MARGIN, 25.6);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('INSPECTION REPORT', PAGE_W - MARGIN, 13.5, { align: 'right' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.4);
  doc.text(inspection.id, PAGE_W - MARGIN, 19.4, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(170, 195, 215);
  doc.text(formatDateTime(inspection.createdAt), PAGE_W - MARGIN, 25.6, { align: 'right' });

  y = 41;

  /* Demo disclaimer */
  doc.setFillColor(255, 247, 220);
  doc.setDrawColor(235, 196, 120);
  doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'FD');
  doc.setTextColor(146, 78, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DEMO REPORT — NOT PRODUCED BY A TRAINED MODEL', MARGIN + 3, y + 5.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.9);
  doc.text(
    'Scores, heatmaps and masks in this document were generated locally in the browser for interface demonstration. The VisA dataset is an evaluation',
    MARGIN + 3,
    y + 10,
  );
  doc.text('resource and is not an inference model.', MARGIN + 3, y + 13.2);
  y += 21;

  /* Result banner */
  const defective = inspection.status === 'DEFECTIVE';
  doc.setFillColor(defective ? 254 : 236, defective ? 236 : 253, defective ? 236 : 245);
  doc.setDrawColor(defective ? 248 : 134, defective ? 113 : 239, defective ? 113 : 172);
  doc.roundedRect(MARGIN, y, CONTENT_W, 17, 2, 2, 'FD');
  doc.setTextColor(defective ? 153 : 6, defective ? 27 : 95, defective ? 27 : 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(defective ? 'DEFECTIVE — ANOMALY DETECTED' : 'NORMAL — NO ANOMALY DETECTED', MARGIN + 4, y + 7.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Anomaly score ${inspection.anomalyScore.toFixed(3)} · threshold ${inspection.threshold.toFixed(2)} · ${inspection.regionCount} region(s) · ${formatDuration(inspection.processingTimeMs)}`,
    MARGIN + 4,
    y + 13,
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(String(inspection.category).toUpperCase(), PAGE_W - MARGIN - 4, y + 7.4, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('VisA category', PAGE_W - MARGIN - 4, y + 12.2, { align: 'right' });
  y += 24;

  /* Details grid */
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Inspection details', MARGIN, y);
  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  const details: Array<[string, string]> = [
    ['Inspection ID', inspection.id],
    ['Product category', String(inspection.category)],
    ['Inspection date', formatDateTime(inspection.createdAt)],
    ['Result', inspection.status],
    ['Anomaly score', inspection.anomalyScore.toFixed(3)],
    ['Decision threshold', inspection.threshold.toFixed(2)],
    ['Detected regions', String(inspection.regionCount)],
    ['Processing time', formatDuration(inspection.processingTimeMs)],
    ['Source image', inspection.imageName || '—'],
    ['Record source', inspection.source === 'demo-seed' ? 'Sample history record' : 'Browser demo analysis'],
  ];

  const colW = CONTENT_W / 2;
  details.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + col * colW;
    const cellY = y + row * 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, cellY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.setTextColor(15, 23, 42);
    const valueLines = doc.splitTextToSize(value, colW - 8) as string[];
    doc.text(valueLines[0] ?? '—', x, cellY + 3.6);
  });
  y += Math.ceil(details.length / 2) * 8 + 6;

  /* Images */
  if (inspection.images) {
    const panels: Array<{ title: string; src: string }> = [
      { title: 'A · Original input', src: inspection.images.original },
      { title: 'B · Anomaly heatmap', src: inspection.images.heatmap },
      { title: 'C · Thresholded anomaly map', src: inspection.images.threshold },
      { title: 'D · Final segmented defect mask', src: inspection.images.mask },
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Visual outputs', MARGIN, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5;

    const gap = 5;
    const cellW = (CONTENT_W - gap) / 2;
    const cellH = 44;

    for (let i = 0; i < panels.length; i += 1) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = MARGIN + col * (cellW + gap);
      const cellY = y + row * (cellH + 9);
      const panel = panels[i];

      doc.setFillColor(8, 17, 31);
      doc.roundedRect(x, cellY, cellW, cellH + 6, 1.5, 1.5, 'F');

      try {
        const aspect = await loadAspect(panel.src);
        let drawW = cellW - 4;
        let drawH = drawW / aspect;
        if (drawH > cellH - 2) {
          drawH = cellH - 2;
          drawW = drawH * aspect;
        }
        const drawX = x + (cellW - drawW) / 2;
        const drawY = cellY + 2 + (cellH - 2 - drawH) / 2;
        doc.addImage(panel.src, dataUrlFormat(panel.src), drawX, drawY, drawW, drawH, undefined, 'FAST');
      } catch {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.text('Image unavailable', x + cellW / 2, cellY + cellH / 2, { align: 'center' });
      }

      doc.setTextColor(226, 232, 240);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.6);
      doc.text(panel.title, x + 2, cellY + cellH + 3.4);
    }

    y += 2 * (cellH + 9) + 4;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text(
      'No imagery stored for this record (older history entries keep summary data only).',
      MARGIN,
      y + 2,
    );
    y += 8;
  }

  /* Regions */
  if (inspection.regions.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Detected anomaly regions', MARGIN, y);
    y += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y, CONTENT_W, 6, 'F');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text('#', MARGIN + 2, y + 4);
    doc.text('LABEL', MARGIN + 10, y + 4);
    doc.text('LOCATION (X%, Y%)', MARGIN + 62, y + 4);
    doc.text('AREA (W% × H%)', MARGIN + 112, y + 4);
    doc.text('CONFIDENCE', PAGE_W - MARGIN - 2, y + 4, { align: 'right' });
    y += 6;

    inspection.regions.forEach((region, index) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      if (index % 2 === 0) {
        doc.setFillColor(250, 251, 253);
        doc.rect(MARGIN, y, CONTENT_W, 6, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(15, 23, 42);
      doc.text(String(region.id), MARGIN + 2, y + 4);
      doc.text(region.label, MARGIN + 10, y + 4);
      doc.text(`${region.xPct.toFixed(1)} , ${region.yPct.toFixed(1)}`, MARGIN + 62, y + 4);
      doc.text(`${region.widthPct.toFixed(1)} × ${region.heightPct.toFixed(1)}`, MARGIN + 112, y + 4);
      doc.text(`${(region.confidence * 100).toFixed(1)}%`, PAGE_W - MARGIN - 2, y + 4, { align: 'right' });
      y += 6;
    });
    y += 5;
  }

  /* Ground-truth comparison */
  if (inspection.maskComparison) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    const comparison = inspection.maskComparison;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Ground-truth mask comparison', MARGIN, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Pixel agreement ${(comparison.pixelAgreement * 100).toFixed(2)}%   ·   IoU ${(comparison.iou * 100).toFixed(2)}%   ·   Precision ${(comparison.precision * 100).toFixed(2)}%   ·   Recall ${(comparison.recall * 100).toFixed(2)}%`,
      MARGIN,
      y + 2,
    );
    y += 10;
  }

  /* Footer */
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 283, PAGE_W - MARGIN, 283);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'VISION INSPECT AI · demo frontend build · research reference: amazon-science/spot-diff (VisA)',
      MARGIN,
      287.5,
    );
    doc.text(`Page ${page} of ${pageCount}`, PAGE_W - MARGIN, 287.5, { align: 'right' });
  }

  doc.save(`vision-inspect-${inspection.id}.pdf`);
}
