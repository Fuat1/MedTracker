import type { BPRecord } from '../../../shared/api/bp-repository';

// Matches BPTrendChart.tsx fixed range
const Y_MIN = 70;
const Y_MAX = 180;
const Y_RANGE = Y_MAX - Y_MIN;

const ZONE_NORMAL_MAX = 120;
const ZONE_ELEVATED_MAX = 140;

const PADDING_TOP = 16;
const PADDING_BOTTOM = 36;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 72;

// SVG viewport — high resolution for print
const SVG_WIDTH = 800;
const SVG_HEIGHT = 240;
const CHART_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

// AHA color palette (always light mode for medical PDF)
const ZONE_COLOR_NORMAL = '#dcfce7';
const ZONE_COLOR_ELEVATED = '#fef9c3';
const ZONE_COLOR_HIGH = '#fecaca';
const COLOR_SYSTOLIC = '#0D9488';
const COLOR_DIASTOLIC = '#5EEAD4';

function getY(value: number): number {
  const clamped = Math.max(Y_MIN, Math.min(Y_MAX, value));
  return PADDING_TOP + CHART_HEIGHT - ((clamped - Y_MIN) / Y_RANGE) * CHART_HEIGHT;
}

function getX(index: number, total: number): number {
  const step = total > 1 ? CHART_WIDTH / (total - 1) : 0;
  return PADDING_LEFT + (total > 1 ? index * step : CHART_WIDTH / 2);
}

function buildPath(
  records: BPRecord[],
  getValue: (r: BPRecord) => number,
): string {
  if (records.length < 2) return '';
  return records
    .map((r, i) => {
      const x = getX(i, records.length);
      const y = getY(getValue(r));
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function formatDateLabel(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function generateBPChartSvg(records: BPRecord[]): string {
  if (records.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}">
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT / 2}" text-anchor="middle" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">No data</text>
</svg>`;
  }

  // Sort records oldest → newest for chart
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);

  // Zone boundary Y positions
  const yNormalMax = getY(ZONE_NORMAL_MAX);
  const yElevatedMax = getY(ZONE_ELEVATED_MAX);
  const yTop = PADDING_TOP;
  const yBottom = PADDING_TOP + CHART_HEIGHT;

  const normalH = yBottom - yNormalMax;
  const elevatedH = yNormalMax - yElevatedMax;
  const highH = yElevatedMax - yTop;

  const systolicPath = buildPath(sorted, r => r.systolic);
  const diastolicPath = buildPath(sorted, r => r.diastolic);

  // X-axis date labels — show at most 7
  const labelStep = Math.max(1, Math.floor(sorted.length / 7));
  const dateLabels = sorted
    .filter((_, i) => i % labelStep === 0 || i === sorted.length - 1)
    .map(r => {
      const origIdx = sorted.findIndex(s => s.id === r.id);
      const x = getX(origIdx, sorted.length);
      const y = PADDING_TOP + CHART_HEIGHT + 18;
      return `<text x="${x.toFixed(1)}" y="${y}" text-anchor="middle" fill="#64748b" font-size="11" font-family="Arial, sans-serif">${formatDateLabel(r.timestamp)}</text>`;
    })
    .join('\n  ');

  // Y-axis labels
  const yLabels = [70, 90, 110, 120, 130, 140, 160, 180]
    .map(v => {
      const y = getY(v);
      return `<text x="${PADDING_LEFT - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#94a3b8" font-size="10" font-family="Arial, sans-serif">${v}</text>`;
    })
    .join('\n  ');

  // Data points (only show if few records)
  const dots = sorted.length <= 30
    ? sorted.map((r, idx) => {
        const x = getX(idx, sorted.length);
        const ys = getY(r.systolic);
        const yd = getY(r.diastolic);
        return `<circle cx="${x.toFixed(1)}" cy="${ys.toFixed(1)}" r="3" fill="${COLOR_SYSTOLIC}" />
  <circle cx="${x.toFixed(1)}" cy="${yd.toFixed(1)}" r="3" fill="${COLOR_DIASTOLIC}" />`;
      }).join('\n  ')
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}">
  <!-- Zone backgrounds -->
  <rect x="${PADDING_LEFT}" y="${yNormalMax.toFixed(1)}" width="${CHART_WIDTH}" height="${normalH.toFixed(1)}" fill="${ZONE_COLOR_NORMAL}" />
  <rect x="${PADDING_LEFT}" y="${yElevatedMax.toFixed(1)}" width="${CHART_WIDTH}" height="${elevatedH.toFixed(1)}" fill="${ZONE_COLOR_ELEVATED}" />
  <rect x="${PADDING_LEFT}" y="${yTop}" width="${CHART_WIDTH}" height="${highH.toFixed(1)}" fill="${ZONE_COLOR_HIGH}" />
  <!-- Zone labels -->
  <text x="${(PADDING_LEFT + CHART_WIDTH + 4).toFixed(1)}" y="${(yBottom - normalH / 2 + 4).toFixed(1)}" fill="#16a34a" font-size="10" font-family="Arial, sans-serif">Normal</text>
  <text x="${(PADDING_LEFT + CHART_WIDTH + 4).toFixed(1)}" y="${(yElevatedMax + elevatedH / 2 + 4).toFixed(1)}" fill="#ca8a04" font-size="10" font-family="Arial, sans-serif">Elevated</text>
  <text x="${(PADDING_LEFT + CHART_WIDTH + 4).toFixed(1)}" y="${(yTop + highH / 2 + 4).toFixed(1)}" fill="#dc2626" font-size="10" font-family="Arial, sans-serif">High</text>
  <!-- Chart border -->
  <rect x="${PADDING_LEFT}" y="${PADDING_TOP}" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" fill="none" stroke="#e2e8f0" stroke-width="1" />
  <!-- Y-axis labels -->
  ${yLabels}
  <!-- Date labels -->
  ${dateLabels}
  <!-- Systolic line (solid) -->
  ${systolicPath ? `<path d="${systolicPath}" fill="none" stroke="${COLOR_SYSTOLIC}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" data-series="systolic" />` : ''}
  <!-- Diastolic line (dashed) -->
  ${diastolicPath ? `<path d="${diastolicPath}" fill="none" stroke="${COLOR_DIASTOLIC}" stroke-width="2" stroke-dasharray="6,3" stroke-linecap="round" stroke-linejoin="round" data-series="diastolic" />` : ''}
  <!-- Data points -->
  ${dots}
  <!-- Legend -->
  <rect x="${PADDING_LEFT}" y="${SVG_HEIGHT - 18}" width="16" height="3" fill="${COLOR_SYSTOLIC}" rx="1"/>
  <text x="${PADDING_LEFT + 20}" y="${SVG_HEIGHT - 11}" fill="#1a1a2e" font-size="12" font-family="Arial, sans-serif">Systolic</text>
  <rect x="${PADDING_LEFT + 90}" y="${SVG_HEIGHT - 18}" width="16" height="3" fill="${COLOR_DIASTOLIC}" stroke-dasharray="4,2" rx="1"/>
  <text x="${PADDING_LEFT + 110}" y="${SVG_HEIGHT - 11}" fill="#1a1a2e" font-size="12" font-family="Arial, sans-serif">Diastolic</text>
</svg>`;
}
