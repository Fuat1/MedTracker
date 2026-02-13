# PDF Report Export — Design Document
**Date:** 2026-02-13
**Status:** Approved

## Overview

Generate a clinical-quality, shareable PDF report of BP readings for doctor visits.
The report is triggered from the Analytics page and covers a user-selected time period.

## Approach

`react-native-html-to-pdf` converts an HTML string (with inline SVG chart) to a PDF file.
The PDF is opened via the native viewer / share sheet.

**Why this approach:**
- 1 native dependency; SVG renders crisply at any zoom/print resolution
- All logic is pure functions (testable without React)
- Reuses the existing BPTrendChart math

## FSD Structure

```
src/features/export-pdf/
├── index.ts
└── lib/
    ├── use-export-pdf.ts           ← React hook: orchestrates export
    ├── generate-report-html.ts     ← Pure fn: records + options → HTML string
    ├── generate-bp-chart-svg.ts    ← Pure fn: records → raw SVG XML string
    └── compute-report-stats.ts     ← Pure fn: records → stats + category breakdown

src/shared/api/pdf-client.ts        ← react-native-html-to-pdf thin wrapper

(modified) src/pages/analytics/ui/AnalyticsPage.tsx
(modified) src/shared/config/locales/en/pages.json
```

**New npm package:** `react-native-html-to-pdf`
_(Requires `pod install` on iOS after installation)_

## Data Flow

```
useBPRecords()  ← all records, no limit
  ↓
filterByPeriod(records, period, customStart?, customEnd?)
  ↓
useExportPdf().exportPdf(filteredRecords, { period, doctorNote, userName })
  ├── computeReportStats(records, guideline)   → avgSys, avgDia, avgPulse, min, max, count, categoryBreakdown
  ├── generateBPChartSvg(records)              → SVG XML string (800×240, zone backgrounds)
  └── generateReportHtml(records, stats, svg, options)  → HTML string
        ↓
RNHTMLtoPDF.convert({ html, fileName })
  ↓
Linking.openURL('file://...pdf')   ← native viewer / share sheet
```

## Analytics Page UI Changes

```
┌─────────────────────────────────────────────┐
│ Period: [7d] [14d] [30d] [90d] [All] [Custom] │  ← OptionChip row
│                                             │
│ (Custom: shows From [date] → To [date] inline)
│                                             │
│ [BPTrendChart for selected period]          │
│ [Weekly Average card] [AM/PM card]          │
│                                             │
│ ─── Doctor Notes (optional) ────────────── │
│ [ TextInput: "Add notes for doctor..." ]    │  ← native keyboard OK (not BP entry)
│                                             │
│ [Export PDF report for Doctor] ←────────── │  ← now functional (was "coming soon")
└─────────────────────────────────────────────┘
```

- Default period: **30d**
- `useBPRecords()` (no limit) — filter in memory
- Custom period: two `DateTimePicker` instances (start + end) shown inline
- Doctor notes: optional `TextInput`, max 500 chars

## PDF Report Layout (A4 Portrait)

```
┌─────────────────────────────────────────┐
│ MEDTRACKER  Blood Pressure Report       │  ← header
│ Patient: Alex  |  Feb 2026              │
│ Period: Last 30 days (Jan 14 – Feb 13)  │
│ Guideline: AHA/ACC 2025                 │
├─────────────────────────────────────────┤
│ Summary                                 │
│ Total: 45 readings                      │  ← stats block
│ Average: 128/82 mmHg  |  Pulse: 72 BPM │
│ Min: 115/70  |  Max: 152/95 mmHg        │
├─────────────────────────────────────────┤
│ Patient Notes (optional highlighted box)│  ← only shown if non-empty
│ "On lisinopril 10mg, started Jan 2026"  │
├─────────────────────────────────────────┤
│ [SVG Trend Chart — systolic + diastolic]│  ← inline SVG, zone backgrounds
│ Systolic ──  Diastolic ╌╌               │
│  Normal ░  Elevated ░  High ░           │
├─────────────────────────────────────────┤
│ Category Breakdown                      │
│ Category   | Range      | Count |  %   │  ← color-coded rows
│ Normal     | <120/<80   |   20  | 44%  │
│ Elevated   | 120-129    |   12  | 27%  │
│ Stage 1    | 130-139    |    8  | 18%  │
│ Stage 2    | ≥140/≥90   |    5  | 11%  │
├─────────────────────────────────────────┤
│ All Readings                            │
│ Date/Time  | Sys | Dia | Pls | Category│  ← table, paginated naturally by PDF
│ Feb 13 9am | 128 |  82 |  72 | Normal  │
│ ...                                     │
└─────────────────────────────────────────┘
```

**Chart SVG specs:**
- `viewBox="0 0 800 240"` — high DPI for print
- Reuses exact calculation logic from `BPTrendChart.tsx`
- Zone backgrounds: green (<120), yellow (120–140), red (>140)
- Systolic: solid line; Diastolic: dashed line
- X-axis: date labels; Y-axis: 70–180 mmHg

**Report language:** Always English (consistent for medical professionals regardless of app language).

## Translation Keys (en/pages.json)

```json
"analytics": {
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
    "fileName": "bp-report"
  }
}
```

## Pure Function Signatures

```typescript
// compute-report-stats.ts
interface ReportStats {
  total: number;
  avgSystolic: number; avgDiastolic: number; avgPulse: number;
  minSystolic: number; maxSystolic: number;
  minDiastolic: number; maxDiastolic: number;
  categoryBreakdown: Array<{ label: string; range: string; count: number; percent: number; color: string }>;
}
export function computeReportStats(records: BPRecord[], guideline: BPGuideline): ReportStats

// generate-bp-chart-svg.ts
export function generateBPChartSvg(records: BPRecord[]): string  // returns SVG XML string

// generate-report-html.ts
interface ReportOptions {
  period: string;          // human-readable period label
  userName: string;
  generatedDate: string;
  guidelineName: string;
  doctorNote?: string;
}
export function generateReportHtml(
  records: BPRecord[],
  stats: ReportStats,
  chartSvg: string,
  options: ReportOptions
): string  // returns complete HTML string

// use-export-pdf.ts
interface ExportOptions extends ReportOptions {}
export function useExportPdf(): {
  exportPdf: (records: BPRecord[], options: ExportOptions) => Promise<void>;
  isExporting: boolean;
}
```

## Files to Create / Modify

**Create (5 new files):**
1. `src/features/export-pdf/lib/compute-report-stats.ts`
2. `src/features/export-pdf/lib/generate-bp-chart-svg.ts`
3. `src/features/export-pdf/lib/generate-report-html.ts`
4. `src/features/export-pdf/lib/use-export-pdf.ts`
5. `src/features/export-pdf/index.ts`
6. `src/shared/api/pdf-client.ts`

**Modify (2 files):**
7. `src/pages/analytics/ui/AnalyticsPage.tsx` — period selector, doctor note field, wired export button
8. `src/shared/config/locales/en/pages.json` — analytics.period.*, doctorNote.*, report.* keys

**Install:**
- `npm install react-native-html-to-pdf`
- iOS: `cd ios && pod install`
