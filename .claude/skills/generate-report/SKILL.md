# Generate Report Skill

**Invocation**: `/generate-report` or when user asks to "export PDF report" or "create doctor report"

**Purpose**: Generate clinical-quality PDF reports of blood pressure data using existing export infrastructure

## Skill Behavior

This skill orchestrates PDF generation by leveraging the existing `features/export-pdf` layer:

### Step 1: Clarify Report Parameters

Ask user to specify:
- **Date range**: Last 7 days / 14 days / 30 days / 90 days / All time / Custom range
- **Include derived metrics**: PP (Pulse Pressure) and MAP (Mean Arterial Pressure)?
- **Doctor notes**: Optional text annotation for physician (max 500 chars)
- **Guideline**: Which classification system to use (AHA/ACC, WHO, ESC/ESH, JSH)?

**Default values**:
- Range: Last 30 days
- Derived metrics: No (opt-in only)
- Notes: Empty
- Guideline: From settings store (default AHA/ACC)

### Step 2: Fetch BP Records

Use existing entity layer hook:
```typescript
import { useBPRecords } from '@/entities/blood-pressure';

const { data: records } = useBPRecords(); // Fetch all records
```

**Filter by date range**:
```typescript
const now = Math.floor(Date.now() / 1000);
const periodSeconds = {
  '7d': 7 * 24 * 60 * 60,
  '14d': 14 * 24 * 60 * 60,
  '30d': 30 * 24 * 60 * 60,
  '90d': 90 * 24 * 60 * 60,
  'all': Infinity,
};

const cutoff = now - periodSeconds[period];
const filteredRecords = records.filter(r => r.timestamp >= cutoff);
```

### Step 3: Compute Report Statistics

Use existing pure function:
```typescript
import { computeReportStats } from '@/features/export-pdf/lib/compute-report-stats';

const stats = computeReportStats(filteredRecords);
// Returns: { totalReadings, avgSystolic, avgDiastolic, avgPulse, avgPP?, avgMAP? }
```

**With derived metrics**:
```typescript
import { calculatePulsePressure, calculateMAP } from '@/entities/blood-pressure';

const enrichedRecords = filteredRecords.map(r => ({
  ...r,
  pp: calculatePulsePressure(r.systolic, r.diastolic),
  map: calculateMAP(r.systolic, r.diastolic),
}));
```

### Step 4: Generate BP Chart SVG

Use existing pure function:
```typescript
import { generateBPChartSvg } from '@/features/export-pdf/lib/generate-bp-chart-svg';

const chartSvg = generateBPChartSvg(filteredRecords, {
  width: 800,
  height: 400,
  guideline: selectedGuideline,
});
```

**Chart features** (auto-generated):
- Zone backgrounds (Normal green <120, Elevated yellow 120-140, High red >140)
- Systolic line (solid, accent color)
- Diastolic line (dashed, lighter teal)
- Date labels on X-axis
- Gridlines for readability

### Step 5: Generate Report HTML

Use existing pure function:
```typescript
import { generateReportHtml } from '@/features/export-pdf/lib/generate-report-html';

const html = generateReportHtml({
  records: filteredRecords,
  stats,
  chartSvg,
  period: '30d',
  patientName: 'Patient', // Optional: from settings
  guideline: selectedGuideline,
  doctorNotes: optionalNotes,
  includePPMAP: includeMetrics,
  generatedDate: new Date().toLocaleDateString(),
});
```

**HTML structure** (auto-generated):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Inline CSS for PDF rendering */
    body { font-family: Arial, sans-serif; }
    .header { background: #0D9488; color: white; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; }
    /* ... theme colors, layout */
  </style>
</head>
<body>
  <div class="header">
    <h1>Blood Pressure Report</h1>
    <p>Period: Last 30 days</p>
  </div>

  <div class="summary">
    <h2>Summary Statistics</h2>
    <div class="stats-grid">
      <div>Total Readings: 42</div>
      <div>Average BP: 128/82 mmHg</div>
      <!-- ... more stats -->
    </div>
  </div>

  <div class="chart">
    <h2>BP Trend</h2>
    <!-- Inline SVG chart -->
  </div>

  <div class="category-breakdown">
    <h2>Classification Breakdown</h2>
    <table>
      <tr><td>Normal</td><td>18 readings (43%)</td></tr>
      <tr><td>Elevated</td><td>12 readings (29%)</td></tr>
      <!-- ... -->
    </table>
  </div>

  <div class="readings-table">
    <h2>All Readings</h2>
    <table>
      <thead>
        <tr><th>Date</th><th>Time</th><th>Systolic</th><th>Diastolic</th><th>Pulse</th><th>Category</th></tr>
      </thead>
      <tbody>
        <!-- ... all readings sorted newest first -->
      </tbody>
    </table>
  </div>

  <footer>
    <p>⚠️ This report is for informational purposes only. Consult your healthcare provider.</p>
  </footer>
</body>
</html>
```

### Step 6: Convert HTML to PDF

Use existing PDF client:
```typescript
import { useExportPdf } from '@/features/export-pdf';

const exportPdf = useExportPdf();
const filePath = await exportPdf.exportPdf({
  records: filteredRecords,
  period: '30d',
  doctorNotes: optionalNotes,
  includePPMAP: includeMetrics,
});
```

**PDF generation** (via `react-native-html-to-pdf`):
```typescript
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const options = {
  html: reportHtml,
  fileName: `MedTracker_BP_Report_${new Date().toISOString().split('T')[0]}`,
  directory: 'Documents',
  base64: false,
};

const file = await RNHTMLtoPDF.convert(options);
const filePath = file.filePath;
// e.g., /storage/emulated/0/Documents/MedTracker_BP_Report_2026-02-15.pdf
```

### Step 7: Share or Save PDF

**Android**:
```typescript
import Share from 'react-native-share';

await Share.open({
  url: `file://${filePath}`,
  type: 'application/pdf',
  title: 'Share BP Report',
});
```

**iOS**:
```typescript
await Share.open({
  url: filePath,
  type: 'application/pdf',
});
```

**Save to device**:
- Android: File saved to `/storage/emulated/0/Documents/`
- iOS: File saved to app's Documents directory (accessible via Files app)

## Report Sections (Auto-Generated)

### 1. Header
- Report title: "Blood Pressure Report"
- Patient name (optional, from settings)
- Date range: "January 15 - February 14, 2026"
- Guideline used: "AHA/ACC 2025 Guidelines"
- Generated date: "Generated on February 15, 2026"

### 2. Summary Statistics Grid
- **Total Readings**: Count of records in period
- **Average BP**: Mean systolic/diastolic (e.g., "128/82 mmHg")
- **Average Pulse**: Mean pulse (if available)
- **Min Systolic**: Lowest systolic value
- **Max Systolic**: Highest systolic value
- **Diastolic Range**: `${min}-${max} mmHg`
- **Average PP**: (if includePPMAP enabled)
- **Average MAP**: (if includePPMAP enabled)

### 3. Doctor Notes (Optional)
If user provided notes:
```
Notes for Healthcare Provider:
Patient reports increased stress at work over past 2 weeks.
Compliance with medication has been excellent.
```

### 4. BP Trend Chart
- SVG chart with colored zone backgrounds
- Systolic line (solid) + Diastolic line (dashed)
- Date labels on X-axis
- Gridlines for 120 and 140 thresholds

### 5. Category Breakdown Table
Distribution of readings by AHA/ACC category:
```
Normal              18 readings (43%)  [Green]
Elevated            12 readings (29%)  [Yellow]
Stage 1             8 readings (19%)   [Orange]
Stage 2             3 readings (7%)    [Red]
Hypertensive Crisis 1 reading (2%)     [Deep Red]
```

### 6. All Readings Table
Full log sorted by newest first:
```
Date        Time    Sys  Dia  Pulse  Category  Location   Notes
2026-02-14  08:30   128  82   72     Stage 1   Left Arm   Morning reading
2026-02-13  20:15   122  78   68     Elevated  Left Arm   -
...
```

### 7. Footer
Medical disclaimer:
```
⚠️ Disclaimer
This report is generated by MedTracker, a blood pressure logging application.
It is intended for informational purposes only and does not constitute medical advice.
Always consult your healthcare provider for interpretation and treatment decisions.
```

## Quality Assurance Checks

Before PDF generation, verify:
- [ ] At least 1 record exists in selected period
- [ ] All BP values are within valid range (40-300 / 30-200)
- [ ] Chart renders correctly (no NaN or Infinity values)
- [ ] Medical disclaimer is present in footer
- [ ] Guideline name matches user selection
- [ ] PP/MAP columns only shown if `includePPMAP: true`

## Error Handling

**No records in period**:
```typescript
if (filteredRecords.length === 0) {
  showToast('No readings found in selected period', 'error');
  return;
}
```

**PDF generation fails**:
```typescript
try {
  const file = await RNHTMLtoPDF.convert(options);
  showToast('Report generated successfully', 'success');
} catch (error) {
  console.error('PDF generation error:', error);
  showToast('Failed to generate PDF. Please try again.', 'error');
}
```

**Share fails (user cancels)**:
```typescript
try {
  await Share.open({ url: filePath });
} catch (error) {
  if (error.message !== 'User did not share') {
    showToast('Failed to share report', 'error');
  }
}
```

## Performance Considerations

**Large datasets** (>500 records):
- Limit chart data points to 90 most recent (prevents SVG bloat)
- Use summary stats only in table (don't render all 500 rows)
- Warn user if report may be slow: "Generating report with 500+ readings..."

**Memory optimization**:
- Generate HTML in chunks (header → stats → chart → table → footer)
- Stream to PDF instead of loading entire HTML string

## Testing Checklist

- [ ] Generate report with 0 records → Show error
- [ ] Generate report with 1 record → Single data point chart
- [ ] Generate report with 100+ records → Performance acceptable
- [ ] Test with PP/MAP enabled → Columns appear in table
- [ ] Test with doctor notes → Notes section appears
- [ ] Test all 4 guidelines (AHA/ACC, WHO, ESC/ESH, JSH) → Thresholds correct
- [ ] Test dark mode → PDF still readable (uses light theme internally)
- [ ] Test custom date range → Correct records filtered
- [ ] Share to email → PDF opens correctly
- [ ] Save to Files app → PDF accessible

## Integration with Analytics Page

The Analytics page already has UI for PDF export:
```typescript
// src/pages/analytics/ui/AnalyticsPage.tsx
const handleExportPdf = async () => {
  await exportPdf.exportPdf({
    records: filteredRecords,
    period: selectedPeriod,
    doctorNotes: notes,
    includePPMAP: includeDerivedMetrics,
  });
};

<TouchableOpacity onPress={handleExportPdf}>
  <Text>{t('analytics.exportPdf')}</Text>
</TouchableOpacity>
```

## Output Format

```markdown
# PDF Report Generated

**File**: MedTracker_BP_Report_2026-02-15.pdf
**Path**: /storage/emulated/0/Documents/MedTracker_BP_Report_2026-02-15.pdf
**Size**: 247 KB

## Report Details
- **Period**: Last 30 days (January 15 - February 14, 2026)
- **Readings**: 42 total
- **Guideline**: AHA/ACC 2025
- **Derived metrics**: PP and MAP included
- **Doctor notes**: Yes (128 characters)

## Next Steps
1. Open PDF in your device's file manager
2. Share via email/messaging to your healthcare provider
3. Print for physical records

## File Location
- **Android**: Files app → Documents → MedTracker_BP_Report_2026-02-15.pdf
- **iOS**: Files app → On My iPhone → MedTracker → Documents
```

## Exit Behavior

- If generation succeeds: Show success toast + file path
- If generation fails: Show error toast + retry suggestion
- If user cancels share: Silent (no error)

## References

- PDF export implementation: `src/features/export-pdf/`
- Analytics page integration: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Medical guidelines: `docs/bp-classification-guidelines.md`
- Derived metrics: `src/entities/blood-pressure/lib.ts` (calculatePulsePressure, calculateMAP)
