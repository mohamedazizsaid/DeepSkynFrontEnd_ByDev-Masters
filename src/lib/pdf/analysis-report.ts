import jsPDF from 'jspdf';
import type { Analysis } from '../types/analysis';

const COLOR_PRIMARY = [14, 165, 233] as const; // #0EA5E9
const COLOR_DARK = [15, 23, 42] as const; // #0F172A
const COLOR_MUTED = [100, 116, 139] as const; // #64748B
const COLOR_BORDER = [226, 232, 240] as const; // #E2E8F0

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 16;
const MAX_Y = 280;

const safeText = (value: unknown, fallback = '—'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && Number.isNaN(value)) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
};

const getMinMetricScore = (analysis: Analysis): number | null => {
  const metrics = analysis.results?.detailedAnalysis;
  if (!metrics) return null;
  const scores = Object.values(metrics).map((m) => m?.score).filter((s) => typeof s === 'number');
  if (!scores.length) return null;
  return Math.min(...(scores as number[]));
};

const getSeverityLabel = (analysis: Analysis): string => {
  const minScore = getMinMetricScore(analysis);
  if (minScore === null) return '—';
  if (minScore < 50) return 'SEVERE';
  if (minScore < 70) return 'MODEREE';
  return 'LEGERE';
};

const getProfileLabel = (analysis: Analysis): string => {
  const score = analysis.healthScore ?? analysis.results?.healthScore;
  if (typeof score !== 'number') return 'Profil peau';
  if (score >= 80) return 'Peau Saine';
  if (score >= 65) return 'Peau Equilibree';
  return 'Peau Fragilisee';
};

const drawDivider = (pdf: jsPDF, y: number) => {
  pdf.setDrawColor(...COLOR_BORDER);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
};

const ensureSpace = (pdf: jsPDF, y: number, needed: number): number => {
  if (y + needed <= MAX_Y) return y;
  pdf.addPage();
  return 20;
};

const drawSectionTitle = (pdf: jsPDF, title: string, y: number): number => {
  y = ensureSpace(pdf, y, 12);
  pdf.setFontSize(13);
  pdf.setTextColor(...COLOR_PRIMARY);
  pdf.text(title, MARGIN_X, y);
  y += 6;
  drawDivider(pdf, y);
  return y + 6;
};

const drawCard = (pdf: jsPDF, x: number, y: number, w: number, h: number) => {
  pdf.setDrawColor(...COLOR_BORDER);
  pdf.setFillColor(245, 249, 255);
  pdf.roundedRect(x, y, w, h, 2, 2, 'FD');
};

const addKeyIndicator = (pdf: jsPDF, x: number, y: number, label: string, value: string) => {
  drawCard(pdf, x, y, 84, 16);
  pdf.setFontSize(8.5);
  pdf.setTextColor(...COLOR_MUTED);
  pdf.text(label, x + 4, y + 6);
  pdf.setFontSize(10.5);
  pdf.setTextColor(...COLOR_DARK);
  pdf.text(value, x + 4, y + 12.5);
};

const addMetricRow = (pdf: jsPDF, y: number, label: string, score: number | null, description: string) => {
  y = ensureSpace(pdf, y, 12);
  pdf.setFontSize(10.5);
  pdf.setTextColor(...COLOR_DARK);
  pdf.text(label, MARGIN_X, y);
  const scoreText = typeof score === 'number' ? `${score}/100` : '—';
  pdf.setTextColor(...COLOR_MUTED);
  pdf.text(scoreText, PAGE_WIDTH - MARGIN_X - 18, y);

  // bar
  const barY = y + 2.5;
  const barX = MARGIN_X;
  const barW = PAGE_WIDTH - MARGIN_X * 2 - 22;
  pdf.setDrawColor(...COLOR_BORDER);
  pdf.setFillColor(236, 244, 255);
  pdf.roundedRect(barX, barY, barW, 3.5, 1, 1, 'FD');
  if (typeof score === 'number') {
    const fillW = Math.max(0, Math.min(barW, (score / 100) * barW));
    pdf.setFillColor(...COLOR_PRIMARY);
    pdf.roundedRect(barX, barY, fillW, 3.5, 1, 1, 'F');
  }

  if (description) {
    const textY = barY + 6.5;
    pdf.setFontSize(9);
    pdf.setTextColor(...COLOR_MUTED);
    const lines = pdf.splitTextToSize(description, PAGE_WIDTH - MARGIN_X * 2 - 4);
    pdf.text(lines, MARGIN_X, textY);
    y = textY + lines.length * 4.2 + 3;
  } else {
    y += 6;
  }
  return y;
};

export const generateAnalysisPdf = (analysis: Analysis, fileName = 'deepskyn-analysis.pdf') => {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Header
  pdf.setFillColor(...COLOR_PRIMARY);
  pdf.roundedRect(MARGIN_X, 10, 24, 24, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text('DS', MARGIN_X + 8, 25);

  pdf.setTextColor(...COLOR_DARK);
  pdf.setFontSize(10);
  pdf.text(`Ref: ${analysis.id}`, PAGE_WIDTH - MARGIN_X - 40, 16);

  pdf.setFontSize(16);
  pdf.text('SYNTHESE DE VOTRE ANALYSE', MARGIN_X, 46);

  pdf.setFontSize(10);
  pdf.setTextColor(...COLOR_MUTED);
  const createdAt = analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : '—';
  pdf.text(`Date: ${createdAt}`, MARGIN_X, 54);

  // Profile card
  drawCard(pdf, MARGIN_X, 60, PAGE_WIDTH - MARGIN_X * 2, 24);
  pdf.setFontSize(9);
  pdf.setTextColor(...COLOR_MUTED);
  pdf.text('VOTRE PROFIL CUTANE', MARGIN_X + 6, 68);
  pdf.setFontSize(12);
  pdf.setTextColor(...COLOR_DARK);
  pdf.text(getProfileLabel(analysis), MARGIN_X + 6, 76);

  const severity = getSeverityLabel(analysis);
  pdf.setFontSize(9);
  pdf.setTextColor(239, 68, 68);
  pdf.text(severity, PAGE_WIDTH - MARGIN_X - 24, 76);

  let y = 92;
  y = drawSectionTitle(pdf, 'INDICATEURS CLES', y);

  const skinType = safeText(analysis.results?.skinType || analysis.results?.skinType, '—');
  const concerns = analysis.results?.concerns?.length ? analysis.results?.concerns.join(', ') : 'Aucune';
  const conditions = analysis.results?.conditions?.length ? analysis.results?.conditions.join(', ') : 'Aucune';
  const score = safeText(analysis.healthScore ?? analysis.results?.healthScore, '—');
  const skinAge = safeText(analysis.skinAge ?? analysis.results?.skinAge, '—');

  addKeyIndicator(pdf, MARGIN_X, y, 'Type de peau', skinType);
  addKeyIndicator(pdf, MARGIN_X + 90, y, 'Score global', `${score}/100`);
  y += 20;
  addKeyIndicator(pdf, MARGIN_X, y, 'Age cutane', `${skinAge}`);
  addKeyIndicator(pdf, MARGIN_X + 90, y, 'Preoccupations', concerns);
  y += 22;

  y = drawSectionTitle(pdf, 'ANALYSE DE VOTRE PROFIL CUTANE', y);
  const summary = safeText(analysis.results?.summary, 'Aucune synthese disponible pour le moment.');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLOR_DARK);
  const summaryLines = pdf.splitTextToSize(summary, PAGE_WIDTH - MARGIN_X * 2);
  pdf.text(summaryLines, MARGIN_X, y);
  y += summaryLines.length * 4.5 + 6;

  y = drawSectionTitle(pdf, 'DIAGNOSTIC ZONE PAR ZONE', y);
  const detailed = analysis.results?.detailedAnalysis;
  if (detailed) {
    const orderedKeys = ['hydration','texture','pores','pigmentation','wrinkles','acne','redness','elasticity'];
    for (const key of orderedKeys) {
      const metric = (detailed as any)[key];
      y = addMetricRow(pdf, y, key.charAt(0).toUpperCase() + key.slice(1), metric?.score ?? null, metric?.description ?? '');
    }
  } else {
    pdf.setFontSize(10);
    pdf.setTextColor(...COLOR_MUTED);
    pdf.text('Aucune donnee detaillee disponible.', MARGIN_X, y + 4);
    y += 10;
  }

  y = drawSectionTitle(pdf, 'RECOMMANDATIONS', y);
  const recs = analysis.recommendations || analysis.results?.recommendations;
  if (recs) {
    const sections = [
      { label: 'Produits', items: recs.products },
      { label: 'Ingredients', items: recs.ingredients },
      { label: 'Lifestyle', items: recs.lifestyle },
      { label: 'Alertes', items: recs.warnings },
    ];
    sections.forEach((section) => {
      y = ensureSpace(pdf, y, 10);
      pdf.setFontSize(10);
      pdf.setTextColor(...COLOR_DARK);
      pdf.text(section.label + ':', MARGIN_X, y);
      const items = section.items?.length ? section.items.join(', ') : '—';
      const lines = pdf.splitTextToSize(items, PAGE_WIDTH - MARGIN_X * 2 - 2);
      pdf.setFontSize(9.5);
      pdf.setTextColor(...COLOR_MUTED);
      pdf.text(lines, MARGIN_X, y + 5);
      y += lines.length * 4.2 + 6;
    });
  } else {
    pdf.setFontSize(10);
    pdf.setTextColor(...COLOR_MUTED);
    pdf.text('Aucune recommandation disponible.', MARGIN_X, y + 4);
    y += 10;
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(...COLOR_MUTED);
  pdf.text('Document confidentiel - Ne remplace pas un avis medical', MARGIN_X, PAGE_HEIGHT - 10);

  pdf.save(fileName);
};
