# Circadian Analysis & Lifestyle Tagging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Phase 2.2 (Circadian Analysis — time-window grouping, morning surge detection, time-in-range donut chart) and Phase 2.3 (Lifestyle Tagging — 7 tags on readings, correlation insights, junction-table DB storage).

**Architecture:** Pure functions in `shared/lib/` and `entities/` (fully testable); new UI components in `shared/ui/`; DB migration adds `bp_tags` junction table; both features are **additive** — zero changes to existing BP save logic.

**Tech Stack:** React Native CLI, TypeScript strict, op-sqlite (JSI), TanStack Query, Reanimated, react-native-svg, react-native-vector-icons/Ionicons, i18next, Zustand.

---

## How to run tests

```bash
cd c:\Users\fuats\Desktop\Workdir\MedTracker
npx jest --testPathPattern="<file>" --no-coverage
```

All pure-function tests run without a device (no native mocks needed).

---

## PART A — Circadian Analysis (Phase 2.2)

---

### Task 1: Pure functions — `circadian-utils.ts`

**Files:**
- Create: `src/shared/lib/circadian-utils.ts`
- Create: `src/shared/lib/__tests__/circadian-utils.test.ts`
- Modify: `src/shared/lib/index.ts` — add exports

**Step 1: Write the failing test**

Create `src/shared/lib/__tests__/circadian-utils.test.ts`:

```typescript
import {
  getTimeWindow,
  computeCircadianBreakdown,
  detectMorningSurge,
  computeTimeInRange,
} from '../circadian-utils';
import { BP_GUIDELINES } from '../../config/settings';
import type { BPRecord } from '../../api/bp-repository';

// Helper — timestamp at specific hour today
function atHour(h: number): number {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function makeRecord(
  systolic: number,
  diastolic: number,
  timestamp: number,
): BPRecord {
  return {
    id: `${timestamp}`,
    systolic,
    diastolic,
    pulse: null,
    timestamp,
    timezoneOffset: 0,
    location: 'left_arm',
    posture: 'sitting',
    notes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    isSynced: false,
  };
}

describe('getTimeWindow', () => {
  it('classifies 6am as morning', () => {
    expect(getTimeWindow(atHour(6))).toBe('morning');
  });
  it('classifies 9:59am as morning', () => {
    const d = new Date();
    d.setHours(9, 59, 0, 0);
    expect(getTimeWindow(Math.floor(d.getTime() / 1000))).toBe('morning');
  });
  it('classifies 10am as day', () => {
    expect(getTimeWindow(atHour(10))).toBe('day');
  });
  it('classifies 18pm as evening', () => {
    expect(getTimeWindow(atHour(18))).toBe('evening');
  });
  it('classifies 22pm as night', () => {
    expect(getTimeWindow(atHour(22))).toBe('night');
  });
  it('classifies midnight (0) as night', () => {
    expect(getTimeWindow(atHour(0))).toBe('night');
  });
});

describe('computeCircadianBreakdown', () => {
  it('returns empty arrays for no records', () => {
    const result = computeCircadianBreakdown([]);
    expect(result.morning.length).toBe(0);
    expect(result.day.length).toBe(0);
    expect(result.evening.length).toBe(0);
    expect(result.night.length).toBe(0);
  });

  it('groups records into correct windows', () => {
    const records = [
      makeRecord(120, 80, atHour(7)),  // morning
      makeRecord(125, 82, atHour(14)), // day
      makeRecord(130, 85, atHour(20)), // evening
      makeRecord(118, 78, atHour(23)), // night
    ];
    const result = computeCircadianBreakdown(records);
    expect(result.morning.length).toBe(1);
    expect(result.day.length).toBe(1);
    expect(result.evening.length).toBe(1);
    expect(result.night.length).toBe(1);
  });

  it('computes correct averages per window', () => {
    const records = [
      makeRecord(120, 80, atHour(7)),
      makeRecord(140, 90, atHour(8)),
    ];
    const result = computeCircadianBreakdown(records);
    expect(result.morning.length).toBe(2);
    expect(result.morningAvg!.systolic).toBe(130);
    expect(result.morningAvg!.diastolic).toBe(85);
  });
});

describe('detectMorningSurge', () => {
  it('returns no surge when fewer than 2 readings', () => {
    const records = [makeRecord(120, 80, atHour(7))];
    expect(detectMorningSurge(records).hasSurge).toBe(false);
  });

  it('detects surge when morning is ≥20 mmHg above prior night avg', () => {
    // Prior night reading
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 0, 0, 0);
    const nightTs = Math.floor(yesterday.getTime() / 1000);

    const records = [
      makeRecord(100, 70, nightTs),           // night avg = 100
      makeRecord(125, 80, atHour(7)),          // morning = 125 → delta = 25 ≥ 20
    ];
    const result = detectMorningSurge(records);
    expect(result.hasSurge).toBe(true);
    expect(result.delta).toBeGreaterThanOrEqual(20);
  });

  it('returns no surge when delta is below threshold', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 0, 0, 0);
    const nightTs = Math.floor(yesterday.getTime() / 1000);

    const records = [
      makeRecord(115, 75, nightTs),
      makeRecord(125, 80, atHour(7)), // delta = 10 < 20
    ];
    const result = detectMorningSurge(records);
    expect(result.hasSurge).toBe(false);
  });
});

describe('computeTimeInRange', () => {
  it('returns all zeros for empty records', () => {
    const result = computeTimeInRange([], BP_GUIDELINES.AHA_ACC);
    expect(result.overall.normal).toBe(0);
  });

  it('correctly classifies and computes percentages (AHA/ACC)', () => {
    const records = [
      makeRecord(115, 75, atHour(7)),  // normal
      makeRecord(115, 75, atHour(8)),  // normal
      makeRecord(125, 79, atHour(9)),  // elevated
      makeRecord(145, 92, atHour(10)), // stage2
    ];
    const result = computeTimeInRange(records, BP_GUIDELINES.AHA_ACC);
    expect(result.overall.normal).toBe(50);
    expect(result.overall.elevated).toBe(25);
    expect(result.overall.stage2).toBe(25);
  });
});
```

**Step 2: Run test to confirm it fails**

```bash
npx jest circadian-utils --no-coverage
```
Expected: FAIL — `Cannot find module '../circadian-utils'`

**Step 3: Implement `src/shared/lib/circadian-utils.ts`**

```typescript
import { classifyBP } from '../../entities/blood-pressure';
import type { BPRecord } from '../api/bp-repository';
import type { BPGuideline } from '../config/settings';

export type TimeWindow = 'morning' | 'day' | 'evening' | 'night';

export interface CircadianAvg {
  systolic: number;
  diastolic: number;
  count: number;
}

export interface CircadianBreakdown {
  morning: BPRecord[];
  day: BPRecord[];
  evening: BPRecord[];
  night: BPRecord[];
  morningAvg: CircadianAvg | null;
  dayAvg: CircadianAvg | null;
  eveningAvg: CircadianAvg | null;
  nightAvg: CircadianAvg | null;
}

export interface MorningSurgeResult {
  hasSurge: boolean;
  delta: number;
  surgeRecordId: string | null;
}

export interface TimeInRangeWindow {
  normal: number;
  elevated: number;
  stage1: number;
  stage2: number;
  crisis: number;
}

export interface TimeInRangeResult {
  overall: TimeInRangeWindow;
  morning: TimeInRangeWindow;
  day: TimeInRangeWindow;
  evening: TimeInRangeWindow;
  night: TimeInRangeWindow;
}

/** Returns time window for a Unix epoch timestamp */
export function getTimeWindow(timestamp: number): TimeWindow {
  const hour = new Date(timestamp * 1000).getHours();
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function avgWindow(records: BPRecord[]): CircadianAvg | null {
  if (records.length === 0) return null;
  return {
    systolic: Math.round(records.reduce((s, r) => s + r.systolic, 0) / records.length),
    diastolic: Math.round(records.reduce((s, r) => s + r.diastolic, 0) / records.length),
    count: records.length,
  };
}

/** Groups records into the 4 time windows, computes averages */
export function computeCircadianBreakdown(records: BPRecord[]): CircadianBreakdown {
  const morning: BPRecord[] = [];
  const day: BPRecord[] = [];
  const evening: BPRecord[] = [];
  const night: BPRecord[] = [];

  for (const r of records) {
    switch (getTimeWindow(r.timestamp)) {
      case 'morning': morning.push(r); break;
      case 'day':     day.push(r);     break;
      case 'evening': evening.push(r); break;
      case 'night':   night.push(r);   break;
    }
  }

  return {
    morning, day, evening, night,
    morningAvg: avgWindow(morning),
    dayAvg:     avgWindow(day),
    eveningAvg: avgWindow(evening),
    nightAvg:   avgWindow(night),
  };
}

/** Threshold (mmHg systolic rise from prior-night avg) for morning surge */
const SURGE_THRESHOLD = 20;

/**
 * Detects morning surge: first morning reading's systolic ≥ SURGE_THRESHOLD
 * above the average of yesterday's night readings.
 */
export function detectMorningSurge(records: BPRecord[]): MorningSurgeResult {
  const NO_SURGE: MorningSurgeResult = { hasSurge: false, delta: 0, surgeRecordId: null };

  // Get today's first morning reading (smallest timestamp in today's morning window)
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTs = Math.floor(todayStart.getTime() / 1000);

  const todayMorning = records
    .filter(r => r.timestamp >= todayStartTs && getTimeWindow(r.timestamp) === 'morning')
    .sort((a, b) => a.timestamp - b.timestamp);

  if (todayMorning.length === 0) return NO_SURGE;
  const firstMorning = todayMorning[0];

  // Get prior night readings (yesterday 22:00 → today 05:59)
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(22, 0, 0, 0);
  const yesterdayStartTs = Math.floor(yesterdayStart.getTime() / 1000);
  const todayMorningStart = todayStartTs + 6 * 3600; // 06:00 today

  const priorNight = records.filter(
    r => r.timestamp >= yesterdayStartTs && r.timestamp < todayMorningStart && getTimeWindow(r.timestamp) === 'night',
  );

  if (priorNight.length === 0) return NO_SURGE;

  const nightAvgSystolic = priorNight.reduce((s, r) => s + r.systolic, 0) / priorNight.length;
  const delta = Math.round(firstMorning.systolic - nightAvgSystolic);

  if (delta >= SURGE_THRESHOLD) {
    return { hasSurge: true, delta, surgeRecordId: firstMorning.id };
  }
  return NO_SURGE;
}

function emptyWindow(): TimeInRangeWindow {
  return { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 };
}

function computeWindowPercents(windowRecords: BPRecord[], guideline: BPGuideline): TimeInRangeWindow {
  if (windowRecords.length === 0) return emptyWindow();
  const counts = { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 };
  for (const r of windowRecords) {
    const cat = classifyBP(r.systolic, r.diastolic, guideline);
    // classifyBP returns BP_CATEGORIES keys
    if (cat === 'normal') counts.normal++;
    else if (cat === 'elevated') counts.elevated++;
    else if (cat === 'stage_1') counts.stage1++;
    else if (cat === 'stage_2') counts.stage2++;
    else if (cat === 'crisis') counts.crisis++;
  }
  const total = windowRecords.length;
  return {
    normal:   Math.round((counts.normal   / total) * 100),
    elevated: Math.round((counts.elevated / total) * 100),
    stage1:   Math.round((counts.stage1   / total) * 100),
    stage2:   Math.round((counts.stage2   / total) * 100),
    crisis:   Math.round((counts.crisis   / total) * 100),
  };
}

/** Computes time-in-range percentages overall and per window */
export function computeTimeInRange(records: BPRecord[], guideline: BPGuideline): TimeInRangeResult {
  const bd = computeCircadianBreakdown(records);
  return {
    overall:  computeWindowPercents(records,    guideline),
    morning:  computeWindowPercents(bd.morning, guideline),
    day:      computeWindowPercents(bd.day,     guideline),
    evening:  computeWindowPercents(bd.evening, guideline),
    night:    computeWindowPercents(bd.night,   guideline),
  };
}
```

**Step 4: Run tests**

```bash
npx jest circadian-utils --no-coverage
```
Expected: All tests PASS.

**Step 5: Export from `src/shared/lib/index.ts`**

Add to the existing exports (find the last `export *` line and append after it):

```typescript
export * from './circadian-utils';
```

**Step 6: Commit**

```bash
git add src/shared/lib/circadian-utils.ts src/shared/lib/__tests__/circadian-utils.test.ts src/shared/lib/index.ts
git commit -m "feat(circadian): add pure circadian utils with tests"
```

---

### Task 2: `DonutChart` SVG component

**Files:**
- Create: `src/shared/ui/DonutChart.tsx`
- Modify: `src/shared/ui/index.ts` — add export

**Step 1: Implement `src/shared/ui/DonutChart.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../lib/use-theme';
import { BP_COLORS_LIGHT, BP_COLORS_DARK, FONTS } from '../config/theme';
import { useTranslation } from 'react-i18next';

export interface DonutSegment {
  /** percentage 0–100 */
  percent: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 18,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const { colors, isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build stroke-dasharray/offset per segment
  let cumulativePercent = 0;
  const arcs = segments
    .filter(s => s.percent > 0)
    .map(s => {
      const dashArray = (s.percent / 100) * circumference;
      const dashOffset = circumference - (cumulativePercent / 100) * circumference;
      cumulativePercent += s.percent;
      return { ...s, dashArray, dashOffset };
    });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Segments — rotate so first starts at top */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          {arcs.map((arc, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arc.dashArray} ${circumference}`}
              strokeDashoffset={arc.dashOffset - circumference}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      {/* Center text */}
      {centerLabel && (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={[styles.centerLabel, { color: colors.textPrimary }]}>
            {centerLabel}
          </Text>
          {centerSubLabel && (
            <Text style={[styles.centerSubLabel, { color: colors.textSecondary }]}>
              {centerSubLabel}
            </Text>
          )}
        </View>
      )}
      {/* Legend */}
      <View style={styles.legend}>
        {segments.filter(s => s.percent > 0).map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {s.label} {s.percent}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  centerSubLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  legend: {
    gap: 4,
    alignSelf: 'stretch',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});
```

**Step 2: Export from `src/shared/ui/index.ts`**

Add line:
```typescript
export { DonutChart } from './DonutChart';
export type { DonutSegment } from './DonutChart';
```

**Step 3: Commit**

```bash
git add src/shared/ui/DonutChart.tsx src/shared/ui/index.ts
git commit -m "feat(circadian): add DonutChart SVG component"
```

---

### Task 3: `CircadianBreakdownBars` component

**Files:**
- Create: `src/shared/ui/CircadianBreakdownBars.tsx`
- Modify: `src/shared/ui/index.ts` — add export

**Step 1: Implement `src/shared/ui/CircadianBreakdownBars.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../config/theme';
import { useTranslation } from 'react-i18next';
import type { CircadianAvg } from '../lib/circadian-utils';
import type { TimeInRangeWindow } from '../lib/circadian-utils';

export interface CircadianWindowData {
  windowKey: 'morning' | 'day' | 'evening' | 'night';
  avg: CircadianAvg | null;
  timeInRange: TimeInRangeWindow;
}

interface CircadianBreakdownBarsProps {
  windows: CircadianWindowData[];
}

const WINDOW_ICONS: Record<string, string> = {
  morning: 'sunny-outline',
  day:     'partly-sunny-outline',
  evening: 'cloudy-night-outline',
  night:   'moon-outline',
};

export function CircadianBreakdownBars({ windows }: CircadianBreakdownBarsProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation('common');
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  return (
    <View style={styles.container}>
      {windows.map(w => (
        <View key={w.windowKey} style={styles.row}>
          {/* Icon + label */}
          <View style={styles.labelCol}>
            <Icon name={WINDOW_ICONS[w.windowKey]} size={14} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t(`timeWindow.${w.windowKey}`)}
            </Text>
          </View>

          {/* Segmented bar */}
          <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
            {w.avg ? (
              <>
                <View style={[styles.barSegment, { flex: w.timeInRange.normal,   backgroundColor: bpColors.normal }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.elevated, backgroundColor: bpColors.elevated }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.stage1,   backgroundColor: bpColors.stage_1 }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.stage2,   backgroundColor: bpColors.stage_2 }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.crisis,   backgroundColor: bpColors.crisis }]} />
              </>
            ) : (
              <View style={[styles.barSegment, { flex: 1, backgroundColor: colors.surfaceSecondary }]} />
            )}
          </View>

          {/* Avg value */}
          <Text style={[styles.avgText, { color: colors.textPrimary }]}>
            {w.avg ? `${w.avg.systolic}/${w.avg.diastolic}` : '--'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelCol: {
    width: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  avgText: {
    width: 64,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
```

**Step 2: Export from `src/shared/ui/index.ts`**

```typescript
export { CircadianBreakdownBars } from './CircadianBreakdownBars';
export type { CircadianWindowData } from './CircadianBreakdownBars';
```

**Step 3: Commit**

```bash
git add src/shared/ui/CircadianBreakdownBars.tsx src/shared/ui/index.ts
git commit -m "feat(circadian): add CircadianBreakdownBars component"
```

---

### Task 4: Add time-window + surge badges to `BPRecordCard`

**Files:**
- Modify: `src/widgets/bp-record-card/ui/BPRecordCard.tsx`

**What to change:** In the compact variant, add a small time-window pill after the BP value column. In the full variant, add the time-window pill next to the category badge, and optionally a "Surge" amber badge.

Locate the compact variant's `<View style={compactStyles.badge}...>` block (line ~69) and add a time-window chip before it:

```typescript
// Add import at top
import { getTimeWindow } from '../../../shared/lib';

// Inside compact variant, before the category badge View:
const window = getTimeWindow(record.timestamp);
const windowIcon = {
  morning: 'sunny-outline',
  day: 'partly-sunny-outline',
  evening: 'cloudy-night-outline',
  night: 'moon-outline',
}[window];

// Add this element between valueColumn and the badge:
<View style={[compactStyles.windowBadge, { backgroundColor: colors.surfaceSecondary }]}>
  <Icon name={windowIcon} size={10} color={colors.textTertiary} />
</View>
```

For the full variant, add after the `timestampRow` block and before notes:

```typescript
{/* Time Window + Surge row */}
<View style={styles.windowRow}>
  <View style={[styles.windowChip, { backgroundColor: colors.surfaceSecondary }]}>
    <Icon name={windowIcon} size={11} color={colors.textSecondary} />
    <Text style={[styles.windowChipText, { color: colors.textSecondary }]}>
      {t(`timeWindow.${window}`)}
    </Text>
  </View>
  {record.isMorningSurge && (
    <View style={[styles.surgeChip, { backgroundColor: '#f97316' + '20' }]}>
      <Icon name="trending-up-outline" size={11} color="#f97316" />
      <Text style={[styles.surgeChipText, { color: '#f97316' }]}>
        {t('morningSurge')}
      </Text>
    </View>
  )}
</View>
```

**Important:** `record.isMorningSurge` is **not** in the DB — it must be passed as an optional prop. Update the interface:

```typescript
interface BPRecordCardProps {
  record: BPRecord;
  variant?: 'full' | 'compact';
  isMorningSurge?: boolean;  // ← add this
}
```

Add the corresponding styles:

```typescript
windowRow: {
  flexDirection: 'row',
  gap: 6,
  marginTop: 6,
},
windowChip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
},
windowChipText: {
  fontSize: 11,
  fontFamily: FONTS.medium,
  fontWeight: '500',
},
surgeChip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
},
surgeChipText: {
  fontSize: 11,
  fontFamily: FONTS.medium,
  fontWeight: '500',
},
compactWindowBadge: {
  width: 22,
  height: 22,
  borderRadius: 11,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 4,
},
```

Add translation import: `const { t } = useTranslation('common');` is already present.

**Step 2: Commit**

```bash
git add src/widgets/bp-record-card/ui/BPRecordCard.tsx
git commit -m "feat(circadian): add time-window and surge badges to BPRecordCard"
```

---

### Task 5: Add Circadian Patterns card to `AnalyticsPage`

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/shared/config/locales/en/pages.json` — add keys

**Step 1: Add translation keys to `src/shared/config/locales/en/pages.json`**

Find the `"analytics"` object and add inside it:

```json
"circadian": {
  "title": "Circadian Patterns",
  "timeInRange": "Time in Range",
  "morningSurge_one": "Morning Surge detected {{count}} day",
  "morningSurge_other": "Morning Surge detected {{count}} days",
  "noData": "Not enough data for circadian analysis",
  "windowAvg": "avg"
}
```

**Step 2: Add to `AnalyticsPage.tsx`**

At the top of the file, add imports:

```typescript
import {
  computeCircadianBreakdown,
  computeTimeInRange,
  detectMorningSurge,
} from '../../../shared/lib';
import {
  DonutChart,
  CircadianBreakdownBars,
} from '../../../shared/ui';
import type { DonutSegment, CircadianWindowData } from '../../../shared/ui';
```

After the existing stats computation (weekly average, AM/PM), add:

```typescript
const circadianBreakdown = useMemo(
  () => computeCircadianBreakdown(filteredRecords),
  [filteredRecords],
);

const timeInRange = useMemo(
  () => computeTimeInRange(filteredRecords, guideline),
  [filteredRecords, guideline],
);

const surgeResult = useMemo(
  () => detectMorningSurge(records ?? []),
  [records],
);

const donutSegments: DonutSegment[] = [
  { percent: timeInRange.overall.normal,   color: bpColors.normal,   label: t('analytics.zones.normal') },
  { percent: timeInRange.overall.elevated, color: bpColors.elevated, label: t('analytics.zones.elevated') },
  { percent: timeInRange.overall.stage1,   color: bpColors.stage_1,  label: t('medical:categories.stage1') },
  { percent: timeInRange.overall.stage2,   color: bpColors.stage_2,  label: t('medical:categories.stage2') },
  { percent: timeInRange.overall.crisis,   color: bpColors.crisis,   label: t('medical:categories.crisis') },
];

const circadianWindows: CircadianWindowData[] = [
  { windowKey: 'morning', avg: circadianBreakdown.morningAvg, timeInRange: timeInRange.morning },
  { windowKey: 'day',     avg: circadianBreakdown.dayAvg,     timeInRange: timeInRange.day },
  { windowKey: 'evening', avg: circadianBreakdown.eveningAvg, timeInRange: timeInRange.evening },
  { windowKey: 'night',   avg: circadianBreakdown.nightAvg,   timeInRange: timeInRange.night },
];
```

Insert the Circadian Patterns card in the JSX **after** the existing stats row (`morningVsEvening` card) and **before** the PDF export section:

```tsx
{/* Circadian Patterns Card */}
<View style={[styles.card, { backgroundColor: colors.surface }]}>
  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
    {t('analytics.circadian.title')}
  </Text>

  {filteredRecords.length < 4 ? (
    <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
      {t('analytics.circadian.noData')}
    </Text>
  ) : (
    <>
      {/* Donut Chart — time in range */}
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
        {t('analytics.circadian.timeInRange')}
      </Text>
      <DonutChart
        segments={donutSegments}
        size={140}
        centerLabel={`${timeInRange.overall.normal}%`}
        centerSubLabel={t('medical:categories.normal')}
      />

      {/* Per-window breakdown bars */}
      <CircadianBreakdownBars windows={circadianWindows} />

      {/* Morning surge insight */}
      {surgeResult.hasSurge && (
        <View style={[styles.surgeRow, { backgroundColor: '#f97316' + '15' }]}>
          <Icon name="trending-up-outline" size={14} color="#f97316" />
          <Text style={[styles.surgeText, { color: '#f97316' }]}>
            {t('analytics.circadian.morningSurge', { count: 1 })}
          </Text>
        </View>
      )}
    </>
  )}
</View>
```

Add styles:
```typescript
surgeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  padding: 10,
  borderRadius: 10,
  marginTop: 10,
},
surgeText: {
  fontSize: 13,
  fontFamily: FONTS.semiBold,
  fontWeight: '600',
},
```

**Step 3: Commit**

```bash
git add src/pages/analytics/ui/AnalyticsPage.tsx src/shared/config/locales/en/pages.json
git commit -m "feat(circadian): add Circadian Patterns card to AnalyticsPage"
```

---

### Task 6: Post-save morning surge toast in entry pages

**Files:**
- Modify: `src/pages/quick-log/ui/QuickLogPage.tsx`
- Modify: `src/pages/new-reading/ui/NewReadingPage.tsx`

**What to add:** After a successful `recordBP.mutateAsync()` call, fetch the latest records and run `detectMorningSurge()`. If `hasSurge`, call `showToast()`.

In both pages, the save handler looks like:

```typescript
const savedRecord = await recordBP.mutateAsync({ ... });
// ↓ Add after mutateAsync succeeds:
const latestRecords = await queryClient.fetchQuery({
  queryKey: BP_RECORDS_QUERY_KEY,
  queryFn: () => getBPRecords(),
});
const surge = detectMorningSurge(latestRecords);
if (surge.hasSurge) {
  showToast(
    t('common:morningSurgeAlert', { delta: surge.delta }),
    'warning',
  );
}
```

Add to `common.json` translation keys (Task 7 covers this).

Import at top of each file:
```typescript
import { detectMorningSurge, getBPRecords } from '../../../shared/lib'; // getBPRecords is exported from shared/api via shared/lib
import { useQueryClient } from '@tanstack/react-query';
import { BP_RECORDS_QUERY_KEY } from '../../../features/record-bp';
```

**Step 2: Commit**

```bash
git add src/pages/quick-log/ui/QuickLogPage.tsx src/pages/new-reading/ui/NewReadingPage.tsx
git commit -m "feat(circadian): add morning surge toast after save"
```

---

### Task 7: Circadian i18n keys

**Files:**
- Modify: `src/shared/config/locales/en/common.json`

Add inside the root object:

```json
"timeWindow": {
  "morning": "Morning",
  "day": "Day",
  "evening": "Evening",
  "night": "Night"
},
"morningSurge": "Morning Surge",
"morningSurgeAlert": "Morning surge detected: +{{delta}} mmHg above last night's average"
```

**Step 2: Commit**

```bash
git add src/shared/config/locales/en/common.json
git commit -m "feat(circadian): add i18n keys for time windows and surge alert"
```

---

## PART B — Lifestyle Tagging (Phase 2.3)

---

### Task 8: DB migration + `bp-tags-repository`

**Files:**
- Modify: `src/shared/api/db.ts` — add bp_tags migration
- Create: `src/shared/api/bp-tags-repository.ts`
- Modify: `src/shared/api/index.ts` — export new repository

**Step 1: Add migration to `src/shared/api/db.ts`**

Add after `CREATE_INDEX_SQL`:

```typescript
const CREATE_BP_TAGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS bp_tags (
    id         TEXT PRIMARY KEY NOT NULL,
    record_id  TEXT NOT NULL,
    tag        TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (record_id) REFERENCES bp_records(id) ON DELETE CASCADE
  );
`;

const CREATE_BP_TAGS_IDX_RECORD_SQL = `
  CREATE INDEX IF NOT EXISTS idx_bp_tags_record_id ON bp_tags(record_id);
`;

const CREATE_BP_TAGS_IDX_TAG_SQL = `
  CREATE INDEX IF NOT EXISTS idx_bp_tags_tag ON bp_tags(tag);
`;
```

Then inside `initDatabase()`, after the existing `db.execute(CREATE_INDEX_SQL)`:

```typescript
db.execute(CREATE_BP_TAGS_TABLE_SQL);
db.execute(CREATE_BP_TAGS_IDX_RECORD_SQL);
db.execute(CREATE_BP_TAGS_IDX_TAG_SQL);
```

**Step 2: Create `src/shared/api/bp-tags-repository.ts`**

```typescript
import { getDatabase } from './db';
import { generateUUID, getCurrentTimestamp } from '../lib';
import type { LifestyleTag } from '../../entities/lifestyle-tag';

interface BPTagRow {
  id: string;
  record_id: string;
  tag: string;
  created_at: number;
}

/** Returns all tags for a single record */
export async function getTagsForRecord(recordId: string): Promise<LifestyleTag[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT tag FROM bp_tags WHERE record_id = ? ORDER BY created_at ASC',
    [recordId],
  );
  const rows = (result.rows ?? []) as Array<{ tag: string }>;
  return rows.map(r => r.tag as LifestyleTag);
}

/** Replaces all tags for a record (delete + insert) */
export async function saveTagsForRecord(
  recordId: string,
  tags: LifestyleTag[],
): Promise<void> {
  const db = getDatabase();
  const now = getCurrentTimestamp();

  await db.execute('DELETE FROM bp_tags WHERE record_id = ?', [recordId]);

  for (const tag of tags) {
    await db.execute(
      'INSERT INTO bp_tags (id, record_id, tag, created_at) VALUES (?, ?, ?, ?)',
      [generateUUID(), recordId, tag, now],
    );
  }
}

/** Returns a map of recordId → tag[] for a set of record IDs */
export async function getTagsForRecords(
  recordIds: string[],
): Promise<Record<string, LifestyleTag[]>> {
  if (recordIds.length === 0) return {};
  const db = getDatabase();

  const placeholders = recordIds.map(() => '?').join(',');
  const result = await db.execute(
    `SELECT record_id, tag FROM bp_tags WHERE record_id IN (${placeholders}) ORDER BY created_at ASC`,
    recordIds,
  );

  const rows = (result.rows ?? []) as BPTagRow[];
  const map: Record<string, LifestyleTag[]> = {};
  for (const row of rows) {
    if (!map[row.record_id]) map[row.record_id] = [];
    map[row.record_id].push(row.tag as LifestyleTag);
  }
  return map;
}
```

**Step 3: Export from `src/shared/api/index.ts`**

```typescript
export * from './bp-tags-repository';
```

**Step 4: Commit**

```bash
git add src/shared/api/db.ts src/shared/api/bp-tags-repository.ts src/shared/api/index.ts
git commit -m "feat(tags): add bp_tags DB migration and repository"
```

---

### Task 9: `lifestyle-tag` entity

**Files:**
- Create: `src/entities/lifestyle-tag/lib.ts`
- Create: `src/entities/lifestyle-tag/index.ts`
- Create: `src/entities/lifestyle-tag/__tests__/lib.test.ts`

**Step 1: Write failing test**

Create `src/entities/lifestyle-tag/__tests__/lib.test.ts`:

```typescript
import {
  LIFESTYLE_TAGS,
  computeTagCorrelations,
} from '../lib';
import type { BPRecord } from '../../../shared/api/bp-repository';

function makeRecord(systolic: number, diastolic: number, id: string): BPRecord {
  return {
    id, systolic, diastolic, pulse: null,
    timestamp: 1000, timezoneOffset: 0,
    location: 'left_arm', posture: 'sitting',
    notes: null, createdAt: 1000, updatedAt: 1000, isSynced: false,
  };
}

describe('LIFESTYLE_TAGS', () => {
  it('exports 7 tags', () => {
    expect(LIFESTYLE_TAGS.length).toBe(7);
  });

  it('contains all expected tag keys', () => {
    const keys = LIFESTYLE_TAGS.map(t => t.key);
    expect(keys).toContain('salt');
    expect(keys).toContain('stress');
    expect(keys).toContain('alcohol');
    expect(keys).toContain('exercise');
    expect(keys).toContain('medication');
    expect(keys).toContain('caffeine');
    expect(keys).toContain('poor_sleep');
  });
});

describe('computeTagCorrelations', () => {
  it('returns empty array for no records', () => {
    expect(computeTagCorrelations([], {})).toEqual([]);
  });

  it('ignores tags with fewer than MIN_SAMPLE records', () => {
    // Only 3 records with 'salt' — below MIN_SAMPLE of 5
    const records = [
      makeRecord(130, 85, 'a'),
      makeRecord(135, 88, 'b'),
      makeRecord(132, 86, 'c'),
    ];
    const tagMap: Record<string, string[]> = {
      a: ['salt'], b: ['salt'], c: ['salt'],
    };
    const result = computeTagCorrelations(records, tagMap);
    expect(result.find(r => r.tag === 'salt')).toBeUndefined();
  });

  it('computes positive delta for elevated readings with tag', () => {
    // 5 records with 'stress' → higher systolic
    // 5 records without 'stress' → lower systolic
    const withStress = Array.from({ length: 5 }, (_, i) =>
      makeRecord(150, 95, `w${i}`),
    );
    const withoutStress = Array.from({ length: 5 }, (_, i) =>
      makeRecord(120, 80, `n${i}`),
    );
    const allRecords = [...withStress, ...withoutStress];
    const tagMap: Record<string, string[]> = {};
    withStress.forEach(r => { tagMap[r.id] = ['stress']; });

    const result = computeTagCorrelations(allRecords, tagMap);
    const stressResult = result.find(r => r.tag === 'stress');
    expect(stressResult).toBeDefined();
    expect(stressResult!.delta).toBeGreaterThan(0);
    expect(stressResult!.delta).toBe(30); // 150 - 120
  });
});
```

**Step 2: Run test to confirm failure**

```bash
npx jest lifestyle-tag --no-coverage
```
Expected: FAIL — module not found.

**Step 3: Implement `src/entities/lifestyle-tag/lib.ts`**

```typescript
import type { BPRecord } from '../../shared/api/bp-repository';

export type LifestyleTag =
  | 'salt'
  | 'stress'
  | 'alcohol'
  | 'exercise'
  | 'medication'
  | 'caffeine'
  | 'poor_sleep';

export interface LifestyleTagMeta {
  key: LifestyleTag;
  icon: string;
  labelKey: string; // i18n key: common:tags.<key>
}

export const LIFESTYLE_TAGS: LifestyleTagMeta[] = [
  { key: 'salt',       icon: 'fast-food-outline',  labelKey: 'tags.salt' },
  { key: 'stress',     icon: 'flash-outline',       labelKey: 'tags.stress' },
  { key: 'alcohol',    icon: 'wine-outline',         labelKey: 'tags.alcohol' },
  { key: 'exercise',   icon: 'barbell-outline',      labelKey: 'tags.exercise' },
  { key: 'medication', icon: 'medkit-outline',       labelKey: 'tags.medication' },
  { key: 'caffeine',   icon: 'cafe-outline',          labelKey: 'tags.caffeine' },
  { key: 'poor_sleep', icon: 'moon-outline',          labelKey: 'tags.poorSleep' },
];

export interface TagCorrelationResult {
  tag: LifestyleTag;
  avgSystolicWith: number;
  avgSystolicWithout: number;
  delta: number;     // positive = higher with tag, negative = lower
  sampleSize: number;
}

/** Minimum readings for a tag to appear in correlation results */
const MIN_SAMPLE = 5;

/**
 * Computes systolic delta for each tag: avg(with tag) − avg(without tag).
 * Only included if there are at least MIN_SAMPLE readings with the tag.
 * @param records All BPRecord objects
 * @param tagMap  Map of recordId → LifestyleTag[]
 */
export function computeTagCorrelations(
  records: BPRecord[],
  tagMap: Record<string, LifestyleTag[]>,
): TagCorrelationResult[] {
  if (records.length === 0) return [];

  const results: TagCorrelationResult[] = [];

  for (const { key } of LIFESTYLE_TAGS) {
    const withTag    = records.filter(r => (tagMap[r.id] ?? []).includes(key));
    const withoutTag = records.filter(r => !(tagMap[r.id] ?? []).includes(key));

    if (withTag.length < MIN_SAMPLE) continue;

    const avgWith    = Math.round(withTag.reduce((s, r) => s + r.systolic, 0) / withTag.length);
    const avgWithout = withoutTag.length > 0
      ? Math.round(withoutTag.reduce((s, r) => s + r.systolic, 0) / withoutTag.length)
      : avgWith;

    results.push({
      tag: key,
      avgSystolicWith: avgWith,
      avgSystolicWithout: avgWithout,
      delta: avgWith - avgWithout,
      sampleSize: withTag.length,
    });
  }

  // Sort by |delta| descending
  return results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
```

**Step 4: Create `src/entities/lifestyle-tag/index.ts`**

```typescript
export * from './lib';
```

**Step 5: Run tests**

```bash
npx jest lifestyle-tag --no-coverage
```
Expected: All PASS.

**Step 6: Commit**

```bash
git add src/entities/lifestyle-tag/
git commit -m "feat(tags): add lifestyle-tag entity with computeTagCorrelations"
```

---

### Task 10: `manage-tags` feature (TanStack Query hooks)

**Files:**
- Create: `src/features/manage-tags/model/use-manage-tags.ts`
- Create: `src/features/manage-tags/index.ts`

**Step 1: Implement `src/features/manage-tags/model/use-manage-tags.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTagsForRecord, saveTagsForRecord, getTagsForRecords } from '../../../shared/api';
import type { LifestyleTag } from '../../../entities/lifestyle-tag';

export const TAG_QUERY_KEY = (recordId: string) => ['bp-tags', recordId];
export const TAGS_BULK_KEY = (recordIds: string[]) => ['bp-tags-bulk', ...recordIds];

/** Fetch tags for a single record */
export function useTagsForRecord(recordId: string) {
  return useQuery({
    queryKey: TAG_QUERY_KEY(recordId),
    queryFn: () => getTagsForRecord(recordId),
    enabled: !!recordId,
  });
}

/** Fetch tags for multiple records at once (used by AnalyticsPage) */
export function useTagsForRecords(recordIds: string[]) {
  return useQuery({
    queryKey: TAGS_BULK_KEY(recordIds),
    queryFn: () => getTagsForRecords(recordIds),
    enabled: recordIds.length > 0,
  });
}

/** Save (replace) tags for a single record */
export function useSaveTagsForRecord(recordId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tags: LifestyleTag[]) => saveTagsForRecord(recordId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEY(recordId) });
      // Invalidate all bulk queries (simpler than tracking which keys)
      queryClient.invalidateQueries({ queryKey: ['bp-tags-bulk'] });
    },
  });
}
```

**Step 2: Create `src/features/manage-tags/index.ts`**

```typescript
export * from './model/use-manage-tags';
```

**Step 3: Commit**

```bash
git add src/features/manage-tags/
git commit -m "feat(tags): add manage-tags feature with TanStack Query hooks"
```

---

### Task 11: `TagChips` shared UI component

**Files:**
- Create: `src/shared/ui/TagChips.tsx`
- Modify: `src/shared/ui/index.ts`

**Step 1: Implement `src/shared/ui/TagChips.tsx`**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';
import { LIFESTYLE_TAGS } from '../../entities/lifestyle-tag';
import type { LifestyleTag } from '../../entities/lifestyle-tag';
import { useTranslation } from 'react-i18next';

interface TagChipsProps {
  selectedTags: LifestyleTag[];
  onToggle: (tag: LifestyleTag) => void;
  disabled?: boolean;
}

export function TagChips({ selectedTags, onToggle, disabled = false }: TagChipsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {LIFESTYLE_TAGS.map(({ key, icon, labelKey }) => {
        const isSelected = selectedTags.includes(key);
        return (
          <TouchableOpacity
            key={key}
            onPress={() => !disabled && onToggle(key)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.accent : colors.surfaceSecondary,
                borderColor: isSelected ? colors.accent : colors.borderLight,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled }}
          >
            <Icon
              name={icon}
              size={13}
              color={isSelected ? '#ffffff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? '#ffffff' : colors.textSecondary },
              ]}
            >
              {t(labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
```

**Step 2: Export from `src/shared/ui/index.ts`**

```typescript
export { TagChips } from './TagChips';
```

**Step 3: Commit**

```bash
git add src/shared/ui/TagChips.tsx src/shared/ui/index.ts
git commit -m "feat(tags): add TagChips shared UI component"
```

---

### Task 12: Add TagChips to entry pages (QuickLog + NewReading)

**Files:**
- Modify: `src/pages/quick-log/ui/QuickLogPage.tsx`
- Modify: `src/pages/new-reading/ui/NewReadingPage.tsx`

**Pattern to follow in each file:**

**1. Add state:**
```typescript
const [selectedTags, setSelectedTags] = useState<LifestyleTag[]>([]);

const handleTagToggle = (tag: LifestyleTag) => {
  setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
  );
};
```

**2. Import:**
```typescript
import { TagChips } from '../../../shared/ui';
import type { LifestyleTag } from '../../../entities/lifestyle-tag';
import { useSaveTagsForRecord } from '../../../features/manage-tags';
```

**3. After save succeeds, save tags:**
```typescript
const savedRecord = await recordBP.mutateAsync({ ... });
if (selectedTags.length > 0) {
  await saveTagsForRecord.mutateAsync(savedRecord.id, selectedTags);
}
```

Note: `useSaveTagsForRecord` needs a `recordId`. Use a pattern like:
```typescript
// Declare but don't bind to a specific ID yet — call the raw repository function
import { saveTagsForRecord as saveTagsRepo } from '../../../shared/api';

// In saveRecord():
if (selectedTags.length > 0) {
  await saveTagsRepo(savedRecord.id, selectedTags);
  queryClient.invalidateQueries({ queryKey: ['bp-tags-bulk'] });
}
```

**4. Add TagChips in JSX** — insert between `DateTimePicker` and `SaveButton`:
```tsx
{/* Tags — optional */}
<View style={styles.tagsSection}>
  <Text style={[styles.tagsSectionLabel, { color: colors.textSecondary }]}>
    {t('common:tags.title')}
  </Text>
  <TagChips
    selectedTags={selectedTags}
    onToggle={handleTagToggle}
    disabled={recordBP.isPending}
  />
</View>
```

**5. Add styles:**
```typescript
tagsSection: {
  paddingVertical: 8,
},
tagsSectionLabel: {
  fontSize: 12,
  fontFamily: FONTS.medium,
  fontWeight: '500',
  marginBottom: 8,
},
```

**Step 2: Commit**

```bash
git add src/pages/quick-log/ui/QuickLogPage.tsx src/pages/new-reading/ui/NewReadingPage.tsx
git commit -m "feat(tags): add tag selection to QuickLog and NewReading entry pages"
```

---

### Task 13: Tag display + edit sheet on `BPRecordCard` / `HistoryPage`

**Files:**
- Modify: `src/widgets/bp-record-card/ui/BPRecordCard.tsx` — show tags + handle tap
- Modify: `src/pages/history/ui/HistoryPage.tsx` — add tag edit bottom sheet

**Step 1: Update `BPRecordCard` to accept and show tags**

Update the interface:
```typescript
interface BPRecordCardProps {
  record: BPRecord;
  variant?: 'full' | 'compact';
  isMorningSurge?: boolean;
  tags?: LifestyleTag[];        // ← add
  onEditTags?: () => void;      // ← add (called when card is tapped in full variant)
}
```

In the full variant, after the `timestampRow`, add tag pills:
```tsx
{tags && tags.length > 0 && (
  <View style={styles.tagsRow}>
    {tags.map(tag => {
      const meta = LIFESTYLE_TAGS.find(m => m.key === tag);
      if (!meta) return null;
      return (
        <View key={tag} style={[styles.tagPill, { backgroundColor: colors.surfaceSecondary }]}>
          <Icon name={meta.icon} size={10} color={colors.textSecondary} />
          <Text style={[styles.tagPillText, { color: colors.textSecondary }]}>
            {t(meta.labelKey)}
          </Text>
        </View>
      );
    })}
  </View>
)}
```

Wrap the full variant's outer `TouchableOpacity` `onPress`:
```typescript
onPress={onEditTags}
```

Add import: `import { LIFESTYLE_TAGS } from '../../../entities/lifestyle-tag';`

Add styles:
```typescript
tagsRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 8,
},
tagPill: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 10,
},
tagPillText: {
  fontSize: 11,
  fontFamily: FONTS.regular,
},
```

**Step 2: Add tag edit bottom sheet to `HistoryPage`**

In `HistoryPage`, add state for selected record:
```typescript
const [editTagsRecordId, setEditTagsRecordId] = useState<string | null>(null);
```

Query tags for the selected record:
```typescript
const { data: editingTags = [] } = useTagsForRecord(editTagsRecordId ?? '');
const saveTagsMutation = useSaveTagsForRecord(editTagsRecordId ?? '');
const [pendingTags, setPendingTags] = useState<LifestyleTag[]>([]);

// Sync pendingTags when editTagsRecordId changes
useEffect(() => {
  if (editTagsRecordId) setPendingTags(editingTags);
}, [editTagsRecordId, editingTags]);
```

Pass `onEditTags` to `BPRecordCard`:
```tsx
<BPRecordCard
  record={item}
  variant="full"
  isMorningSurge={surgeResult.surgeRecordId === item.id}
  tags={tagMap[item.id] ?? []}
  onEditTags={() => setEditTagsRecordId(item.id)}
/>
```

Add a simple Modal bottom sheet:
```tsx
<Modal
  visible={!!editTagsRecordId}
  transparent
  animationType="slide"
  onRequestClose={() => setEditTagsRecordId(null)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    onPress={() => setEditTagsRecordId(null)}
    activeOpacity={1}
  />
  <View style={[styles.tagSheet, { backgroundColor: colors.surface }]}>
    <Text style={[styles.tagSheetTitle, { color: colors.textPrimary }]}>
      {t('common:tags.edit')}
    </Text>
    <TagChips
      selectedTags={pendingTags}
      onToggle={tag =>
        setPendingTags(prev =>
          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
        )
      }
    />
    <TouchableOpacity
      style={[styles.tagSheetSave, { backgroundColor: colors.accent }]}
      onPress={async () => {
        await saveTagsMutation.mutateAsync(pendingTags);
        setEditTagsRecordId(null);
      }}
    >
      <Text style={styles.tagSheetSaveText}>{t('common:buttons.save')}</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

Import: `import { Modal } from 'react-native';`, `import { useTagsForRecord, useSaveTagsForRecord, useTagsForRecords } from '../../features/manage-tags';`

Also fetch bulk tags for all records at the top of HistoryPage:
```typescript
const { data: tagMap = {} } = useTagsForRecords((records ?? []).map(r => r.id));
```

Add styles:
```typescript
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
},
tagSheet: {
  padding: 24,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  gap: 16,
},
tagSheetTitle: {
  fontSize: 18,
  fontFamily: FONTS.bold,
  fontWeight: '700',
},
tagSheetSave: {
  height: 48,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 8,
},
tagSheetSaveText: {
  color: '#ffffff',
  fontSize: 16,
  fontFamily: FONTS.bold,
  fontWeight: '700',
},
```

**Step 3: Commit**

```bash
git add src/widgets/bp-record-card/ui/BPRecordCard.tsx src/pages/history/ui/HistoryPage.tsx
git commit -m "feat(tags): add tag display on BPRecordCard and tag edit sheet in HistoryPage"
```

---

### Task 14: Lifestyle Insights card on `AnalyticsPage`

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/shared/config/locales/en/pages.json`

**Step 1: Add translation keys to `pages.json`**

Inside the `"analytics"` object:
```json
"lifestyleInsights": {
  "title": "Lifestyle Insights",
  "mmhgHigher": "+{{delta}} mmHg ({{count}} readings)",
  "mmhgLower": "−{{delta}} mmHg ({{count}} readings)",
  "noData": "Log tags on 5+ readings to see correlations"
}
```

**Step 2: Add to AnalyticsPage**

Add imports:
```typescript
import { computeTagCorrelations } from '../../../entities/lifestyle-tag';
import { useTagsForRecords } from '../../../features/manage-tags';
import { LIFESTYLE_TAGS } from '../../../entities/lifestyle-tag';
```

After existing computed values, add:
```typescript
const recordIds = useMemo(
  () => (records ?? []).map(r => r.id),
  [records],
);
const { data: tagMap = {} } = useTagsForRecords(recordIds);

const tagCorrelations = useMemo(
  () => computeTagCorrelations(filteredRecords, tagMap),
  [filteredRecords, tagMap],
);
```

Insert the Lifestyle Insights card in JSX **after** the Circadian Patterns card:
```tsx
{/* Lifestyle Insights Card */}
{tagCorrelations.length > 0 && (
  <View style={[styles.card, { backgroundColor: colors.surface }]}>
    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
      {t('analytics.lifestyleInsights.title')}
    </Text>
    {tagCorrelations.map(corr => {
      const meta = LIFESTYLE_TAGS.find(m => m.key === corr.tag);
      if (!meta) return null;
      const isPositive = corr.delta > 0;
      const deltaColor = isPositive ? '#ef4444' : '#22c55e';
      return (
        <View key={corr.tag} style={styles.correlationRow}>
          <Icon name={meta.icon} size={16} color={colors.textSecondary} />
          <Text style={[styles.correlationLabel, { color: colors.textPrimary }]}>
            {t(meta.labelKey)}
          </Text>
          <Text style={[styles.correlationDelta, { color: deltaColor }]}>
            {isPositive
              ? t('analytics.lifestyleInsights.mmhgHigher', { delta: corr.delta, count: corr.sampleSize })
              : t('analytics.lifestyleInsights.mmhgLower', { delta: Math.abs(corr.delta), count: corr.sampleSize })
            }
          </Text>
        </View>
      );
    })}
  </View>
)}
```

Add styles:
```typescript
correlationRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingVertical: 8,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: colors.borderLight,
},
correlationLabel: {
  flex: 1,
  fontSize: 14,
  fontFamily: FONTS.medium,
  fontWeight: '500',
},
correlationDelta: {
  fontSize: 13,
  fontFamily: FONTS.semiBold,
  fontWeight: '600',
},
```

**Step 3: Commit**

```bash
git add src/pages/analytics/ui/AnalyticsPage.tsx src/shared/config/locales/en/pages.json
git commit -m "feat(tags): add Lifestyle Insights card to AnalyticsPage"
```

---

### Task 15: Tag i18n keys

**Files:**
- Modify: `src/shared/config/locales/en/common.json`

Add inside root:
```json
"tags": {
  "title": "Tags (optional)",
  "edit": "Edit Tags",
  "salt": "Salt",
  "stress": "Stress",
  "alcohol": "Alcohol",
  "exercise": "Exercise",
  "medication": "Medication",
  "caffeine": "Caffeine",
  "poorSleep": "Poor Sleep"
}
```

**Step 2: Commit**

```bash
git add src/shared/config/locales/en/common.json
git commit -m "feat(tags): add i18n keys for lifestyle tags"
```

---

## Final verification

```bash
# Run all tests
npx jest --no-coverage

# Check TypeScript strict
npx tsc --noEmit
```

Expected: All tests pass, zero TypeScript errors.

---

## Summary of all files changed

| File | Action |
|------|--------|
| `src/shared/lib/circadian-utils.ts` | CREATE |
| `src/shared/lib/__tests__/circadian-utils.test.ts` | CREATE |
| `src/shared/lib/index.ts` | MODIFY |
| `src/shared/ui/DonutChart.tsx` | CREATE |
| `src/shared/ui/CircadianBreakdownBars.tsx` | CREATE |
| `src/shared/ui/TagChips.tsx` | CREATE |
| `src/shared/ui/index.ts` | MODIFY |
| `src/shared/api/db.ts` | MODIFY |
| `src/shared/api/bp-tags-repository.ts` | CREATE |
| `src/shared/api/index.ts` | MODIFY |
| `src/entities/lifestyle-tag/lib.ts` | CREATE |
| `src/entities/lifestyle-tag/index.ts` | CREATE |
| `src/entities/lifestyle-tag/__tests__/lib.test.ts` | CREATE |
| `src/features/manage-tags/model/use-manage-tags.ts` | CREATE |
| `src/features/manage-tags/index.ts` | CREATE |
| `src/widgets/bp-record-card/ui/BPRecordCard.tsx` | MODIFY |
| `src/pages/quick-log/ui/QuickLogPage.tsx` | MODIFY |
| `src/pages/new-reading/ui/NewReadingPage.tsx` | MODIFY |
| `src/pages/history/ui/HistoryPage.tsx` | MODIFY |
| `src/pages/analytics/ui/AnalyticsPage.tsx` | MODIFY |
| `src/shared/config/locales/en/common.json` | MODIFY |
| `src/shared/config/locales/en/pages.json` | MODIFY |
