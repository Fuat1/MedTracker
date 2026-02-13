# PDF Report Export — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate a shareable, clinical-quality PDF of BP readings from the Analytics page.

**Architecture:** Pure functions build an HTML string with an inline SVG chart, `react-native-html-to-pdf` converts it to a file, and the native share sheet opens it. Period filter (7d/14d/30d/90d/All/Custom) and an optional doctor-note field live on the Analytics page.

**Tech Stack:** `react-native-html-to-pdf`, React (hook), TanStack Query (`useBPRecords()`), existing `classifyBP()` / `getBPCategoryLabel()` from `entities/blood-pressure`.

---

## Pre-flight

### Task 0: Install the npm package

**Step 1: Install**

```bash
npm install react-native-html-to-pdf
```

**Step 2: iOS native linking**

```bash
cd ios && pod install && cd ..
```

_(Windows build only: skip pod install until you SSH to Mac.)_

**Step 3: Verify Android auto-linking**

No extra steps for Android — the library auto-links with React Native 0.76+.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(deps): add react-native-html-to-pdf for PDF generation"
```

---

## Task 1: PDF client wrapper (`src/shared/api/pdf-client.ts`)

**Files:**
- Create: `src/shared/api/pdf-client.ts`
- Modify: `src/shared/api/index.ts` (add re-export)

**What it does:** Thin wrapper so the rest of the app never imports the library directly — easier to mock in tests and swap later.

**Step 1: Create the file**

```typescript
// src/shared/api/pdf-client.ts
import RNHTMLtoPDF from 'react-native-html-to-pdf';

export interface PdfOptions {
  html: string;
  fileName: string;
  directory?: string; // default: Documents
}

export interface PdfResult {
  filePath: string;
}

export async function convertHtmlToPdf(options: PdfOptions): Promise<PdfResult> {
  const result = await RNHTMLtoPDF.convert({
    html: options.html,
    fileName: options.fileName,
    directory: options.directory ?? 'Documents',
    base64: false,
  });
  if (!result.filePath) {
    throw new Error('PDF generation failed: no filePath returned');
  }
  return { filePath: result.filePath };
}
```

**Step 2: Add re-export to `src/shared/api/index.ts`**

Open `src/shared/api/index.ts` and append:

```typescript
export { convertHtmlToPdf } from './pdf-client';
export type { PdfOptions, PdfResult } from './pdf-client';
```

**Step 3: Commit**

```bash
git add src/shared/api/pdf-client.ts src/shared/api/index.ts
git commit -m "feat(api): add pdf-client wrapper for react-native-html-to-pdf"
```

---

## Task 2: `compute-report-stats.ts` — pure function + tests

**Files:**
- Create: `src/features/export-pdf/lib/compute-report-stats.ts`
- Create: `src/features/export-pdf/__tests__/compute-report-stats.test.ts`

**What it does:** Takes `BPRecord[]` + guideline, returns stats summary + per-category counts and percentages. Used by the HTML generator and the stats section in the report.

**Step 1: Write the failing test first**

```typescript
// src/features/export-pdf/__tests__/compute-report-stats.test.ts
import { computeReportStats } from '../lib/compute-report-stats';
import { BP_GUIDELINES } from '../../../shared/config/settings';
import type { BPRecord } from '../../../entities/blood-pressure';

const makeRecord = (
  systolic: number,
  diastolic: number,
  pulse: number | null,
  timestamp: number,
): BPRecord => ({
  id: `${timestamp}`,
  systolic,
  diastolic,
  pulse,
  timestamp,
  timezoneOffset: 0,
  location: 'left_arm',
  posture: 'sitting',
  notes: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  isSynced: false,
});

const NOW = Math.floor(Date.now() / 1000);

describe('computeReportStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = computeReportStats([], BP_GUIDELINES.AHA_ACC);
    expect(stats.total).toBe(0);
    expect(stats.avgSystolic).toBe(0);
    expect(stats.avgDiastolic).toBe(0);
  });

  it('computes correct averages and min/max', () => {
    const records = [
      makeRecord(120, 80, 70, NOW - 100),
      makeRecord(140, 90, 80, NOW - 200),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    expect(stats.total).toBe(2);
    expect(stats.avgSystolic).toBe(130);
    expect(stats.avgDiastolic).toBe(85);
    expect(stats.minSystolic).toBe(120);
    expect(stats.maxSystolic).toBe(140);
  });

  it('excludes null pulse from pulse average', () => {
    const records = [
      makeRecord(120, 80, 70, NOW - 100),
      makeRecord(120, 80, null, NOW - 200),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    expect(stats.avgPulse).toBe(70); // only non-null values averaged
  });

  it('counts categories correctly for AHA/ACC', () => {
    const records = [
      makeRecord(115, 75, null, NOW),    // normal
      makeRecord(125, 78, null, NOW),    // elevated
      makeRecord(135, 85, null, NOW),    // stage1
      makeRecord(145, 92, null, NOW),    // stage2
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    const total = stats.categoryBreakdown.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(4);
    const normal = stats.categoryBreakdown.find(c => c.key === 'normal');
    expect(normal?.count).toBe(1);
    expect(normal?.percent).toBe(25);
  });
});
```

**Step 2: Run to confirm failure**

```bash
npx jest src/features/export-pdf/__tests__/compute-report-stats.test.ts
```

Expected: `Cannot find module '../lib/compute-report-stats'`

**Step 3: Implement the function**

```typescript
// src/features/export-pdf/lib/compute-report-stats.ts
import { classifyBP, getBPCategoryLabel } from '../../../entities/blood-pressure';
import type { BPRecord } from '../../../entities/blood-pressure';
import type { BPGuideline } from '../../../shared/config/settings';
import { BP_GUIDELINES } from '../../../shared/config/settings';

export interface CategoryStat {
  key: string;
  label: string;
  range: string;
  count: number;
  percent: number;
  /** Hex color for use in HTML report */
  color: string;
}

export interface ReportStats {
  total: number;
  avgSystolic: number;
  avgDiastolic: number;
  avgPulse: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  categoryBreakdown: CategoryStat[];
}

/** Range description per guideline + category */
function getCategoryRange(key: string, guideline: BPGuideline): string {
  if (guideline === BP_GUIDELINES.AHA_ACC) {
    const ranges: Record<string, string> = {
      normal: '<120 / <80 mmHg',
      elevated: '120–129 / <80 mmHg',
      stage1: '130–139 / 80–89 mmHg',
      stage2: '≥140 / ≥90 mmHg',
      crisis: '≥180 / ≥120 mmHg',
    };
    return ranges[key] ?? '–';
  }
  // ESC/ESH, WHO, JSH share same thresholds (140/90 based)
  const ranges: Record<string, string> = {
    normal: '<130 / <85 mmHg',
    elevated: '130–139 / 85–89 mmHg',
    stage1: '140–159 / 90–99 mmHg',
    stage2: '160–179 / 100–109 mmHg',
    crisis: '≥180 / ≥110 mmHg',
  };
  return ranges[key] ?? '–';
}

const CATEGORY_COLORS: Record<string, string> = {
  normal: '#22c55e',
  elevated: '#eab308',
  stage1: '#f97316',
  stage2: '#ef4444',
  crisis: '#dc2626',
};

const CATEGORY_ORDER = ['normal', 'elevated', 'stage1', 'stage2', 'crisis'];

export function computeReportStats(
  records: BPRecord[],
  guideline: BPGuideline,
): ReportStats {
  if (records.length === 0) {
    return {
      total: 0,
      avgSystolic: 0,
      avgDiastolic: 0,
      avgPulse: 0,
      minSystolic: 0,
      maxSystolic: 0,
      minDiastolic: 0,
      maxDiastolic: 0,
      categoryBreakdown: [],
    };
  }

  const systolics = records.map(r => r.systolic);
  const diastolics = records.map(r => r.diastolic);
  const pulses = records.map(r => r.pulse).filter((p): p is number => p !== null);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const round = (n: number) => Math.round(n);

  // Count categories
  const counts: Record<string, number> = {};
  records.forEach(r => {
    const cat = classifyBP(r.systolic, r.diastolic, guideline);
    counts[cat] = (counts[cat] ?? 0) + 1;
  });

  const categoryBreakdown: CategoryStat[] = CATEGORY_ORDER
    .filter(key => counts[key] !== undefined)
    .map(key => ({
      key,
      label: getBPCategoryLabel(key as any),
      range: getCategoryRange(key, guideline),
      count: counts[key],
      percent: Math.round((counts[key] / records.length) * 100),
      color: CATEGORY_COLORS[key] ?? '#888888',
    }));

  return {
    total: records.length,
    avgSystolic: round(sum(systolics) / systolics.length),
    avgDiastolic: round(sum(diastolics) / diastolics.length),
    avgPulse: pulses.length > 0 ? round(sum(pulses) / pulses.length) : 0,
    minSystolic: Math.min(...systolics),
    maxSystolic: Math.max(...systolics),
    minDiastolic: Math.min(...diastolics),
    maxDiastolic: Math.max(...diastolics),
    categoryBreakdown,
  };
}
```

**Step 4: Run tests — expect green**

```bash
npx jest src/features/export-pdf/__tests__/compute-report-stats.test.ts
```

Expected: 4 tests passing.

**Step 5: Commit**

```bash
git add src/features/export-pdf/lib/compute-report-stats.ts \
        src/features/export-pdf/__tests__/compute-report-stats.test.ts
git commit -m "feat(export-pdf): add computeReportStats pure function with tests"
```

---

## Task 3: `generate-bp-chart-svg.ts` — pure function + tests

**Files:**
- Create: `src/features/export-pdf/lib/generate-bp-chart-svg.ts`
- Create: `src/features/export-pdf/__tests__/generate-bp-chart-svg.test.ts`

**What it does:** Converts `BPRecord[]` → raw SVG XML string (no React, no native deps). Reuses the same coordinate math as `shared/ui/BPTrendChart.tsx`.

**Step 1: Write the failing tests**

```typescript
// src/features/export-pdf/__tests__/generate-bp-chart-svg.test.ts
import { generateBPChartSvg } from '../lib/generate-bp-chart-svg';
import type { BPRecord } from '../../../entities/blood-pressure';

const makeRecord = (sys: number, dia: number, ts: number): BPRecord => ({
  id: `${ts}`,
  systolic: sys,
  diastolic: dia,
  pulse: null,
  timestamp: ts,
  timezoneOffset: 0,
  location: 'left_arm',
  posture: 'sitting',
  notes: null,
  createdAt: ts,
  updatedAt: ts,
  isSynced: false,
});

const DAY = 86400;
const NOW = Math.floor(Date.now() / 1000);

describe('generateBPChartSvg', () => {
  it('returns a non-empty SVG string', () => {
    const records = [makeRecord(120, 80, NOW - DAY), makeRecord(130, 85, NOW)];
    const svg = generateBPChartSvg(records);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('returns empty-state SVG for no records', () => {
    const svg = generateBPChartSvg([]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('No data');
  });

  it('includes both systolic and diastolic paths', () => {
    const records = [makeRecord(120, 80, NOW - DAY), makeRecord(130, 85, NOW)];
    const svg = generateBPChartSvg(records);
    expect(svg).toContain('systolic');
    expect(svg).toContain('diastolic');
  });

  it('includes zone background rects', () => {
    const records = [makeRecord(120, 80, NOW)];
    const svg = generateBPChartSvg(records);
    // Three zone backgrounds: normal, elevated, high
    expect(svg.match(/<rect/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
```

**Step 2: Run to confirm failure**

```bash
npx jest src/features/export-pdf/__tests__/generate-bp-chart-svg.test.ts
```

Expected: `Cannot find module '../lib/generate-bp-chart-svg'`

**Step 3: Implement**

```typescript
// src/features/export-pdf/lib/generate-bp-chart-svg.ts
import type { BPRecord } from '../../../entities/blood-pressure';

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
    .map((r, idx) => {
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
    ? sorted.map(r => {
        const x = getX(sorted.indexOf(r), sorted.length);
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
```

**Step 4: Run tests — expect green**

```bash
npx jest src/features/export-pdf/__tests__/generate-bp-chart-svg.test.ts
```

Expected: 4 tests passing.

**Step 5: Commit**

```bash
git add src/features/export-pdf/lib/generate-bp-chart-svg.ts \
        src/features/export-pdf/__tests__/generate-bp-chart-svg.test.ts
git commit -m "feat(export-pdf): add generateBPChartSvg pure function with tests"
```

---

## Task 4: `generate-report-html.ts` — pure function + test

**Files:**
- Create: `src/features/export-pdf/lib/generate-report-html.ts`
- Create: `src/features/export-pdf/__tests__/generate-report-html.test.ts`

**What it does:** Assembles the full HTML report string from stats, SVG, records, and options. Medical styling, A4 portrait, English only.

**Step 1: Write the failing test**

```typescript
// src/features/export-pdf/__tests__/generate-report-html.test.ts
import { generateReportHtml } from '../lib/generate-report-html';
import type { BPRecord } from '../../../entities/blood-pressure';
import type { ReportStats } from '../lib/compute-report-stats';

const stubStats: ReportStats = {
  total: 5,
  avgSystolic: 128,
  avgDiastolic: 82,
  avgPulse: 72,
  minSystolic: 115,
  maxSystolic: 145,
  minDiastolic: 70,
  maxDiastolic: 95,
  categoryBreakdown: [
    { key: 'normal', label: 'Normal', range: '<120/<80', count: 3, percent: 60, color: '#22c55e' },
    { key: 'stage1', label: 'Stage 1', range: '130-139', count: 2, percent: 40, color: '#f97316' },
  ],
};

const stubRecords: BPRecord[] = [
  {
    id: '1',
    systolic: 128,
    diastolic: 82,
    pulse: 72,
    timestamp: Math.floor(Date.now() / 1000),
    timezoneOffset: 0,
    location: 'left_arm',
    posture: 'sitting',
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    isSynced: false,
  },
];

const stubOptions = {
  period: 'Last 30 days',
  userName: 'Alex',
  generatedDate: 'February 13, 2026',
  guidelineName: 'AHA/ACC 2025',
};

describe('generateReportHtml', () => {
  it('returns a string containing DOCTYPE html', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('includes patient name in output', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('Alex');
  });

  it('includes stats values', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('128');
    expect(html).toContain('82');
    expect(html).toContain('5 readings');
  });

  it('includes category breakdown', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('Normal');
    expect(html).toContain('60%');
  });

  it('includes doctor note when provided', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', {
      ...stubOptions,
      doctorNote: 'On lisinopril',
    });
    expect(html).toContain('On lisinopril');
  });

  it('does NOT include notes section when doctorNote is empty', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).not.toContain('Patient Notes');
  });
});
```

**Step 2: Run to confirm failure**

```bash
npx jest src/features/export-pdf/__tests__/generate-report-html.test.ts
```

**Step 3: Implement**

```typescript
// src/features/export-pdf/lib/generate-report-html.ts
import type { BPRecord } from '../../../entities/blood-pressure';
import type { ReportStats } from './compute-report-stats';

export interface ReportOptions {
  period: string;
  userName: string;
  generatedDate: string;
  guidelineName: string;
  doctorNote?: string;
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

function formatPosture(pos: string): string {
  return pos.charAt(0).toUpperCase() + pos.slice(1);
}

function getCategoryLabel(sys: number, dia: number): { label: string; color: string } {
  if (sys >= 180 || dia >= 120) return { label: 'Crisis', color: '#dc2626' };
  if (sys >= 140 || dia >= 90)  return { label: 'Stage 2', color: '#ef4444' };
  if (sys >= 130 || dia >= 80)  return { label: 'Stage 1', color: '#f97316' };
  if (sys >= 120 && dia < 80)   return { label: 'Elevated', color: '#eab308' };
  return { label: 'Normal', color: '#22c55e' };
}

export function generateReportHtml(
  records: BPRecord[],
  stats: ReportStats,
  chartSvg: string,
  options: ReportOptions,
): string {
  const { period, userName, generatedDate, guidelineName, doctorNote } = options;

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
      const cat = getCategoryLabel(r.systolic, r.diastolic);
      return `<tr>
        <td>${formatTimestamp(r.timestamp)}</td>
        <td style="text-align:center;font-weight:600;">${r.systolic}</td>
        <td style="text-align:center;font-weight:600;">${r.diastolic}</td>
        <td style="text-align:center;">${r.pulse ?? '–'}</td>
        <td style="text-align:center;color:${cat.color};font-weight:600;">${cat.label}</td>
        <td>${formatLocation(r.location)}</td>
        <td>${r.notes ?? ''}</td>
      </tr>`;
    })
    .join('\n');

  const doctorNoteSection = doctorNote?.trim()
    ? `<div class="notes-box">
        <h3 style="margin:0 0 8px;color:#1a1a2e;">Patient Notes</h3>
        <p style="margin:0;color:#374151;">${doctorNote.trim()}</p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Blood Pressure Report – ${userName}</title>
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
      <strong>Patient:</strong> ${userName} &nbsp;|&nbsp;
      <strong>Generated:</strong> ${generatedDate}<br/>
      <strong>Period:</strong> ${period} &nbsp;|&nbsp;
      <strong>Guideline:</strong> ${guidelineName}
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
      <th>Date & Time</th>
      <th style="text-align:center;">Systolic</th>
      <th style="text-align:center;">Diastolic</th>
      <th style="text-align:center;">Pulse</th>
      <th style="text-align:center;">Category</th>
      <th>Location</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>${readingRows}</tbody>
</table>

<div class="footer">
  Generated by MedTracker — Encrypted & Offline Blood Pressure Monitor<br/>
  This report is for informational purposes only. Consult your healthcare provider for medical advice.
</div>

</body>
</html>`;
}
```

**Step 4: Run tests — expect green**

```bash
npx jest src/features/export-pdf/__tests__/generate-report-html.test.ts
```

**Step 5: Commit**

```bash
git add src/features/export-pdf/lib/generate-report-html.ts \
        src/features/export-pdf/__tests__/generate-report-html.test.ts
git commit -m "feat(export-pdf): add generateReportHtml pure function with tests"
```

---

## Task 5: `use-export-pdf.ts` hook + barrel export

**Files:**
- Create: `src/features/export-pdf/lib/use-export-pdf.ts`
- Create: `src/features/export-pdf/index.ts`

**What it does:** React hook that fetches all records (via TanStack Query), accepts a filtered `BPRecord[]` + options, calls the pure functions, calls `convertHtmlToPdf`, then opens the file.

**Step 1: Create `__mocks__/react-native-html-to-pdf.js`** (needed for Jest)

```javascript
// __mocks__/react-native-html-to-pdf.js
module.exports = {
  convert: jest.fn().mockResolvedValue({ filePath: '/tmp/test-report.pdf' }),
};
```

_(Create this file at the project root, not inside `src/`.)_

**Step 2: Create the hook**

```typescript
// src/features/export-pdf/lib/use-export-pdf.ts
import { useState, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { computeReportStats } from './compute-report-stats';
import { generateBPChartSvg } from './generate-bp-chart-svg';
import { generateReportHtml } from './generate-report-html';
import { convertHtmlToPdf } from '../../../shared/api';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import type { BPRecord } from '../../../entities/blood-pressure';
import type { ReportOptions } from './generate-report-html';

export interface ExportPdfOptions {
  period: string;
  userName?: string;
  doctorNote?: string;
}

export function useExportPdf() {
  const [isExporting, setIsExporting] = useState(false);
  const { guideline } = useSettingsStore();

  const exportPdf = useCallback(
    async (records: BPRecord[], options: ExportPdfOptions) => {
      if (records.length === 0) {
        Alert.alert('No Data', 'There are no readings in the selected period to export.');
        return;
      }

      setIsExporting(true);
      try {
        const stats = computeReportStats(records, guideline);
        const chartSvg = generateBPChartSvg(records);
        const reportOptions: ReportOptions = {
          period: options.period,
          userName: options.userName ?? 'Patient',
          generatedDate: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          guidelineName: guideline.toUpperCase().replace('_', '/'),
          doctorNote: options.doctorNote,
        };

        const html = generateReportHtml(records, stats, chartSvg, reportOptions);
        const fileName = `bp-report-${Date.now()}`;
        const { filePath } = await convertHtmlToPdf({ html, fileName });

        await Linking.openURL(`file://${filePath}`);
      } catch (error) {
        Alert.alert('Export Failed', 'Could not generate the PDF. Please try again.');
        console.error('[useExportPdf]', error);
      } finally {
        setIsExporting(false);
      }
    },
    [guideline],
  );

  return { exportPdf, isExporting };
}
```

**Step 3: Create barrel export**

```typescript
// src/features/export-pdf/index.ts
export { useExportPdf } from './lib/use-export-pdf';
export type { ExportPdfOptions } from './lib/use-export-pdf';
```

**Step 4: Add to features barrel** (`src/features/index.ts`)

Open `src/features/index.ts` and append:

```typescript
export { useExportPdf } from './export-pdf';
export type { ExportPdfOptions } from './export-pdf';
```

**Step 5: Commit**

```bash
git add src/features/export-pdf/lib/use-export-pdf.ts \
        src/features/export-pdf/index.ts \
        src/features/index.ts \
        __mocks__/react-native-html-to-pdf.js
git commit -m "feat(export-pdf): add useExportPdf hook + barrel exports"
```

---

## Task 6: Translation keys

**Files:**
- Modify: `src/shared/config/locales/en/pages.json`

**Step 1: Add keys to `pages.json`**

In the `analytics` object, add after the existing `zones` key:

```json
"period": {
  "title": "Report Period",
  "days7": "7 Days",
  "days14": "14 Days",
  "days30": "30 Days",
  "days90": "90 Days",
  "all": "All Time",
  "custom": "Custom Range"
},
"customRange": {
  "from": "From",
  "to": "To"
},
"doctorNote": {
  "label": "Doctor Notes (Optional)",
  "placeholder": "Add notes for your doctor (e.g., medications, symptoms...)"
},
"report": {
  "title": "Blood Pressure Report",
  "generatedBy": "Generated by MedTracker",
  "patient": "Patient",
  "period": "Period",
  "guideline": "Guideline",
  "summary": "Summary",
  "totalReadings": "Total Readings",
  "average": "Average",
  "minMax": "Min / Max",
  "patientNotes": "Patient Notes",
  "categoryBreakdown": "Category Breakdown",
  "allReadings": "All Readings",
  "fileName": "bp-report",
  "noData": "No readings in this period to export."
}
```

**Step 2: Commit**

```bash
git add src/shared/config/locales/en/pages.json
git commit -m "feat(i18n): add analytics.period, doctorNote, and report translation keys"
```

---

## Task 7: Update `AnalyticsPage.tsx`

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`

**What changes:**
1. Read all records with `useBPRecords()` (no limit) instead of `useBPRecords(30)`
2. Add period state: `'7d' | '14d' | '30d' | '90d' | 'all' | 'custom'`
3. Add `customStart`/`customEnd` date state for custom range
4. Add `filterByPeriod()` utility inline
5. Period OptionChip row above the chart
6. Inline `DateTimePicker` pair shown when `custom` period is selected
7. Doctor notes `TextInput` below chart section
8. Wire "Export PDF" button to `useExportPdf().exportPdf()`

**Step 1: Read the current file**

```bash
# Read the current AnalyticsPage to understand its full structure before editing
```

_(Use the Read tool on `src/pages/analytics/ui/AnalyticsPage.tsx` to understand what's there before making changes.)_

**Step 2: Add imports at the top** — add these alongside existing imports:

```typescript
import { useState, useCallback } from 'react';
import { TextInput } from 'react-native';
import { OptionChip, DateTimePicker } from '../../../shared/ui';
import { useExportPdf } from '../../../features/export-pdf';
import { DateTimePicker } from '../../../shared/ui';
```

**Step 3: Replace `useBPRecords(30)` with `useBPRecords()`**

Change:
```typescript
const { data: records = [] } = useBPRecords(30);
```
To:
```typescript
const { data: allRecords = [] } = useBPRecords(); // all records, filter in memory
```

**Step 4: Add period state and filter logic** — add inside the component function, below the existing hooks:

```typescript
type PeriodKey = '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';

const [period, setPeriod] = useState<PeriodKey>('30d');
const [customStart, setCustomStart] = useState<Date>(new Date(Date.now() - 30 * 24 * 3600 * 1000));
const [customEnd, setCustomEnd] = useState<Date>(new Date());
const [doctorNote, setDoctorNote] = useState('');

const { exportPdf, isExporting } = useExportPdf();

const filterByPeriod = useCallback(
  (records: typeof allRecords): typeof allRecords => {
    const nowSec = Math.floor(Date.now() / 1000);
    if (period === 'all') return records;
    if (period === 'custom') {
      const startSec = Math.floor(customStart.getTime() / 1000);
      const endSec = Math.floor(customEnd.getTime() / 1000);
      return records.filter(r => r.timestamp >= startSec && r.timestamp <= endSec);
    }
    const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }[period];
    const cutoffSec = nowSec - days * 86400;
    return records.filter(r => r.timestamp >= cutoffSec);
  },
  [period, customStart, customEnd, allRecords],
);

const records = filterByPeriod(allRecords);

const getPeriodLabel = (): string => {
  if (period === 'all') return t('analytics.period.all');
  if (period === 'custom') return `${customStart.toLocaleDateString()} – ${customEnd.toLocaleDateString()}`;
  return t(`analytics.period.${period === '7d' ? 'days7' : period === '14d' ? 'days14' : period === '30d' ? 'days30' : 'days90'}`);
};

const handleExport = () => {
  exportPdf(records, {
    period: getPeriodLabel(),
    doctorNote: doctorNote.trim() || undefined,
  });
};
```

**Step 5: Add period selector UI** — insert above the BP Trends card section:

```tsx
{/* Period Selector */}
<View style={[styles.card, { backgroundColor: colors.surface }]}>
  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
    {t('analytics.period.title')}
  </Text>
  <View style={styles.chipsRow}>
    {(['7d', '14d', '30d', '90d', 'all', 'custom'] as PeriodKey[]).map(p => (
      <OptionChip
        key={p}
        label={
          p === '7d' ? t('analytics.period.days7') :
          p === '14d' ? t('analytics.period.days14') :
          p === '30d' ? t('analytics.period.days30') :
          p === '90d' ? t('analytics.period.days90') :
          p === 'all' ? t('analytics.period.all') :
          t('analytics.period.custom')
        }
        selected={period === p}
        onPress={() => setPeriod(p)}
      />
    ))}
  </View>
  {period === 'custom' && (
    <View style={styles.customRangeRow}>
      <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
        {t('analytics.customRange.from')}
      </Text>
      <DateTimePicker value={customStart} onChange={setCustomStart} />
      <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
        {t('analytics.customRange.to')}
      </Text>
      <DateTimePicker value={customEnd} onChange={setCustomEnd} />
    </View>
  )}
</View>
```

**Step 6: Add doctor notes and wire export button** — replace the existing "Export PDF" TouchableOpacity with:

```tsx
{/* Doctor Notes */}
<View style={[styles.card, { backgroundColor: colors.surface }]}>
  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
    {t('analytics.doctorNote.label')}
  </Text>
  <TextInput
    value={doctorNote}
    onChangeText={setDoctorNote}
    placeholder={t('analytics.doctorNote.placeholder')}
    placeholderTextColor={colors.textTertiary}
    multiline
    maxLength={500}
    style={[
      styles.notesInput,
      {
        color: colors.textPrimary,
        backgroundColor: colors.surfaceSecondary,
        borderColor: colors.border,
      },
    ]}
  />
</View>

{/* Export PDF Button */}
<TouchableOpacity
  style={[styles.exportButton, { backgroundColor: isExporting ? colors.border : colors.accent }]}
  onPress={handleExport}
  disabled={isExporting}
  activeOpacity={0.85}
>
  <Icon name="document-text-outline" size={22} color="#ffffff" />
  <Text style={styles.exportButtonText}>
    {isExporting ? 'Generating PDF...' : t('analytics.exportPdf')}
  </Text>
</TouchableOpacity>
```

**Step 7: Add missing styles**

In `StyleSheet.create(...)` add:

```typescript
chipsRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 10,
},
customRangeRow: {
  marginTop: 14,
  gap: 8,
},
rangeLabel: {
  fontSize: 13,
  fontFamily: FONTS.semiBold,
  fontWeight: '600',
  marginBottom: 4,
},
notesInput: {
  marginTop: 10,
  borderWidth: 1,
  borderRadius: 10,
  padding: 12,
  minHeight: 80,
  fontSize: 14,
  fontFamily: FONTS.regular,
  textAlignVertical: 'top',
},
```

**Step 8: Commit**

```bash
git add src/pages/analytics/ui/AnalyticsPage.tsx
git commit -m "feat(analytics): add period selector, doctor notes, and functional PDF export"
```

---

## Task 8: Update CLAUDE.md + final commit

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Tier 1 roadmap in CLAUDE.md**

Change:
```
- 🚧 PDF reports (in progress)
```
To:
```
- ✅ PDF reports (done February 2026)
```

**Step 2: Add PDF reports section to the completed features area** — add after the pre-measurement guidance section (Section 1.2):

```markdown
#### 1.3 PDF Report Export — Completed ✅
...implementation details...
```

_(See design doc for full details.)_

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark PDF reports as complete in CLAUDE.md roadmap"
```

---

## Testing the Full Flow

1. Build and run the app on device/simulator
2. Add at least 5 BP readings across different dates
3. Navigate to Analytics tab
4. Select "30d" period → verify chart shows filtered data
5. Select "Custom" → verify date pickers appear; adjust range
6. Select "All" → verify all readings shown
7. Type a doctor note (optional)
8. Tap "Export PDF for Doctor"
9. Verify PDF opens in native viewer showing all 4 sections
10. Verify chart renders correctly (zones, dual lines)
11. Verify category breakdown table shows correct counts
12. Verify readings table is sorted newest first
13. Verify doctor note appears in PDF if entered, hidden if empty
14. Test with 0 readings in period → verify alert appears
