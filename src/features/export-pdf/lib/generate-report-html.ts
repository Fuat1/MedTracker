import { classifyBP, calculatePulsePressure, calculateMAP } from '../../../entities/blood-pressure/lib';
import type { BPRecord } from '../../../shared/api/bp-repository';
import type { BPGuideline } from '../../../shared/config/settings';
import type { ReportStats } from './compute-report-stats';

export interface ReportOptions {
  period: string;
  userName: string;
  generatedDate: string;
  guidelineName: string;
  doctorNote?: string;
  guideline?: string; // BPGuideline value e.g. 'aha_acc', 'who', 'esc_esh', 'jsh'
  includePPMAP?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLocation(loc: string): string {
  return loc.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const CATEGORY_DISPLAY: Record<string, { label: string; color: string }> = {
  normal:   { label: 'Normal',  color: '#22c55e' },
  elevated: { label: 'Elevated', color: '#eab308' },
  stage_1:  { label: 'Stage 1', color: '#f97316' },
  stage_2:  { label: 'Stage 2', color: '#ef4444' },
  crisis:   { label: 'Crisis',  color: '#dc2626' },
};

export function generateReportHtml(
  records: BPRecord[],
  stats: ReportStats,
  chartSvg: string,
  options: ReportOptions,
): string {
  const { period, userName, generatedDate, guidelineName, doctorNote, includePPMAP = false } = options;

  const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);

  const categoryRows = stats.categoryBreakdown
    .map(
      c => `<tr>
        <td style="color:${c.color};font-weight:600;">${c.label}</td>
        <td>${c.range}</td>
        <td style="text-align:center;">${c.count}</td>
        <td style="text-align:center;">${c.percent}%</td>
      </tr>`,
    )
    .join('\n');

  const readingRows = sorted
    .map(r => {
      const catKey = classifyBP(r.systolic, r.diastolic, (options.guideline ?? 'aha_acc') as BPGuideline);
      const cat = CATEGORY_DISPLAY[catKey] ?? CATEGORY_DISPLAY.normal;
      const pp = calculatePulsePressure(r.systolic, r.diastolic);
      const map = calculateMAP(r.systolic, r.diastolic);

      const ppMapCells = includePPMAP
        ? `<td style="text-align:center;">${pp}</td>
        <td style="text-align:center;">${map}</td>`
        : '';

      return `<tr>
        <td>${formatTimestamp(r.timestamp)}</td>
        <td style="text-align:center;font-weight:600;">${r.systolic}</td>
        <td style="text-align:center;font-weight:600;">${r.diastolic}</td>
        <td style="text-align:center;">${r.pulse ?? '–'}</td>
        ${ppMapCells}
        <td style="text-align:center;color:${cat.color};font-weight:600;">${cat.label}</td>
        <td>${escapeHtml(formatLocation(r.location))}</td>
        <td>${escapeHtml(r.notes ?? '')}</td>
      </tr>`;
    })
    .join('\n');

  const doctorNoteSection = doctorNote?.trim()
    ? `<div class="notes-box">
        <h3 style="margin:0 0 8px;color:#1a1a2e;">Patient Notes</h3>
        <p style="margin:0;color:#374151;">${escapeHtml(doctorNote.trim())}</p>
      </div>`
    : '';

  const ppMapStatsBoxes = includePPMAP
    ? `  <div class="stat-box">
    <div class="stat-label">Average PP</div>
    <div class="stat-value">${stats.avgPP}</div>
    <div class="stat-unit">mmHg</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Average MAP</div>
    <div class="stat-value">${stats.avgMAP}</div>
    <div class="stat-unit">mmHg</div>
  </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Blood Pressure Report – ${escapeHtml(userName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 32px; }
  h1 { font-size: 22px; color: #0D9488; letter-spacing: -0.5px; }
  h2 { font-size: 15px; color: #1a1a2e; margin: 24px 0 10px; border-bottom: 2px solid #0D9488; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .header-left h1 { margin-bottom: 6px; }
  .header-meta { font-size: 12px; color: #64748b; line-height: 1.8; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
  .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 20px; font-weight: 700; color: #0D9488; margin-top: 2px; }
  .stat-unit { font-size: 11px; color: #64748b; }
  .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; }
  .chart-container { margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; padding: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0D9488; color: #fff; font-size: 12px; font-weight: 600; padding: 8px 10px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>MedTracker — Blood Pressure Report</h1>
    <div class="header-meta">
      <strong>Patient:</strong> ${escapeHtml(userName)} &nbsp;|&nbsp;
      <strong>Generated:</strong> ${escapeHtml(generatedDate)}<br/>
      <strong>Period:</strong> ${escapeHtml(period)} &nbsp;|&nbsp;
      <strong>Guideline:</strong> ${escapeHtml(guidelineName)}
    </div>
  </div>
</div>

<h2>Summary</h2>
<div class="stats-grid">
  <div class="stat-box">
    <div class="stat-label">Total Readings</div>
    <div class="stat-value">${stats.total}</div>
    <div class="stat-unit">readings</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Average BP</div>
    <div class="stat-value">${stats.avgSystolic}/${stats.avgDiastolic}</div>
    <div class="stat-unit">mmHg</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Avg Pulse</div>
    <div class="stat-value">${stats.avgPulse > 0 ? stats.avgPulse : '–'}</div>
    <div class="stat-unit">BPM</div>
  </div>
${ppMapStatsBoxes}
  <div class="stat-box">
    <div class="stat-label">Min Systolic</div>
    <div class="stat-value">${stats.minSystolic}</div>
    <div class="stat-unit">mmHg</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Max Systolic</div>
    <div class="stat-value">${stats.maxSystolic}</div>
    <div class="stat-unit">mmHg</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Range (Dia)</div>
    <div class="stat-value">${stats.minDiastolic}–${stats.maxDiastolic}</div>
    <div class="stat-unit">mmHg</div>
  </div>
</div>

${doctorNoteSection}

<h2>Blood Pressure Trend</h2>
<div class="chart-container">
  ${chartSvg}
</div>

<h2>Category Breakdown</h2>
<table>
  <thead><tr><th>Category</th><th>Range</th><th style="text-align:center;">Count</th><th style="text-align:center;">%</th></tr></thead>
  <tbody>${categoryRows}</tbody>
</table>

<h2>All Readings (${stats.total})</h2>
<table>
  <thead>
    <tr>
      <th>Date &amp; Time</th>
      <th style="text-align:center;">Systolic</th>
      <th style="text-align:center;">Diastolic</th>
      <th style="text-align:center;">Pulse</th>
      ${includePPMAP ? '<th style="text-align:center;">PP</th><th style="text-align:center;">MAP</th>' : ''}
      <th style="text-align:center;">Category</th>
      <th>Location</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>${readingRows}</tbody>
</table>

<div class="footer">
  Generated by MedTracker — Encrypted &amp; Offline Blood Pressure Monitor<br/>
  This report is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
  Blood pressure classifications are based on ${escapeHtml(guidelineName)} guidelines.
  Consult your healthcare provider to interpret these readings in the context of your overall health.
</div>

</body>
</html>`;
}
