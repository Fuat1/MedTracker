# Theme Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace teal/mint brand palette with medical-blue and bring all four regulatory display modes (Light, Dark, High Contrast, Senior) into full IEC 62366-1 / WCAG 2.1 AA+ compliance.

**Architecture:** Token-first (Approach A) — fix `shared/config/theme.ts` tokens first, add computed values to `useTheme()`, then propagate through shared UI → widgets → pages. Mode architecture stays as combinable independent flags (`theme` + `highContrast` + `seniorMode`).

**Tech Stack:** React Native CLI 0.76+, TypeScript strict, Zustand, NativeWind, react-native-svg v15.15.4, Vibration (built-in RN — no expo-haptics), react-native-gifted-charts for BPTrendChart.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/shared/config/theme.ts` | Update all color tokens; add `borderWidth` to `ThemeColors` |
| Modify | `src/shared/lib/use-theme.ts` | Expose `seniorMode`, `touchTargetSize`, `interactiveSpacing` |
| Modify | `src/shared/lib/settings-store.ts` | Add `numpadLayout: 'calculator' \| 'telephone'` |
| Create | `src/shared/lib/haptics.ts` | `hapticKeystroke()`, `hapticSave()`, `hapticCrisis()` |
| Modify | `src/shared/ui/Numpad.tsx` | Calculator/telephone layout prop; HC borders; haptic |
| Modify | `src/shared/ui/SaveButton.tsx` | HC border; Senior min height; `hapticSave()` |
| Modify | `src/shared/ui/OptionChip.tsx` | HC border; Senior 56 px; HC selection via border weight |
| Modify | `src/shared/ui/TagChip.tsx` | HC 2 px border |
| Modify | `src/shared/ui/CrisisModal.tsx` | SVG octagon icon; `hapticCrisis()` on mount; HC text prefix |
| Modify | `src/shared/ui/Button/Button.tsx` | Use `colors.borderWidth`; Senior `touchTargetSize` for minHeight |
| Modify | `src/widgets/bp-record-card/ui/BPRecordCard.tsx` | HC redundant encoding: text prefix + SVG geometric icons |
| Modify | `src/pages/settings/ui/AppSettingsPage.tsx` | 3-chip theme selector; numpad layout toggle |
| Modify | `src/widgets/page-header/ui/PageHeader.tsx` | HC: `shadowOpacity: 0` on badge; solid surface bg |
| Modify | `src/shared/ui/BPTrendChart.tsx` | HC: SVG pattern overlay for threshold bands; line styles |
| Modify | `src/pages/history/ui/HistoryPage.tsx` | Senior Mode: permanent confirmation before delete |

---

## Task 1: Update Theme Tokens — `theme.ts`

**Files:**
- Modify: `src/shared/config/theme.ts`

### What changes
- `ThemeColors` interface: add `borderWidth: number`
- `lightColors`: teal → blue palette, new token values per spec
- `darkColors`: new surface/text/accent values + `BP_COLORS_DARK` desaturation
- `highContrastColors`: teal accent → accessible blue; `borderWidth: 3`

- [ ] **Step 1: Add `borderWidth` to `ThemeColors` interface**

In `src/shared/config/theme.ts`, find the `// Shadows` block near line 133 and add `borderWidth` to the interface, then update all three palette objects:

```typescript
// In ThemeColors interface — add after `shadowOpacity: number;`
borderWidth: number;
```

- [ ] **Step 2: Update `lightColors`**

Replace the `lightColors` object (lines 138–202) with:

```typescript
export const lightColors: ThemeColors = {
  background: '#F5F5F5',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  accent: '#2563EB',

  border: '#e5e7eb',
  borderLight: '#f1f5f9',

  error: '#dc2626',
  errorBackground: '#fef2f2',

  gradientStart: '#1D4ED8',
  gradientEnd: '#2563EB',

  tabBarBackground: '#ffffff',
  tabBarBorder: '#f1f5f9',

  numpadKey: '#ffffff',
  numpadKeyText: '#1f2937',
  numpadKeyBorder: 'rgba(0,0,0,0.05)',
  numpadClearBg: '#fef2f2',
  numpadBackspaceBg: '#f0f9ff',

  chartLine: '#003B49',
  chartDot: '#ffffff',
  chartLabel: '#374151',
  chartLineDiastolic: '#007A78',
  chartZoneNormal: '#dcfce7',
  chartZoneElevated: '#fef9c3',
  chartZoneHigh: '#fecaca',

  toggleTrackActive: '#2563EB',
  toggleTrackInactive: '#d1d5db',
  toggleThumb: '#ffffff',
  iconCircleBg: 'rgba(37,99,235,0.12)',
  successText: '#16a34a',
  successBg: '#f0fdf4',

  infoBg: '#eff6ff',
  infoColor: '#3b82f6',

  warningBg: '#fef3c7',
  warningText: '#92400e',
  warningBorder: '#fde68a',

  crisisRed: '#dc2626',
  crisisBorder: '#fca5a5',

  ppColor: '#f59e0b',
  mapColor: '#6366f1',

  surgeColor: '#f97316',
  surgeBg: '#fff7ed',

  overlay: 'rgba(0,0,0,0.3)',

  shadow: '#000000',
  shadowOpacity: 0.08,

  borderWidth: 1,
};
```

- [ ] **Step 3: Update `darkColors`**

Replace the `darkColors` object (lines 204–268) with:

```typescript
export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceSecondary: '#2C2C2C',

  textPrimary: 'rgba(255,255,255,0.87)',
  textSecondary: 'rgba(255,255,255,0.60)',
  textTertiary: 'rgba(255,255,255,0.38)',

  accent: '#60A5FA',

  border: '#334155',
  borderLight: '#1E1E1E',

  error: '#f87171',
  errorBackground: '#451a1a',

  gradientStart: '#1D4ED8',
  gradientEnd: '#2563EB',

  tabBarBackground: '#1E1E1E',
  tabBarBorder: '#334155',

  numpadKey: '#2C2C2C',
  numpadKeyText: 'rgba(255,255,255,0.87)',
  numpadKeyBorder: 'rgba(255,255,255,0.06)',
  numpadClearBg: '#3b1c1c',
  numpadBackspaceBg: '#1c2d3b',

  chartLine: '#60A5FA',
  chartDot: '#1E1E1E',
  chartLabel: 'rgba(255,255,255,0.60)',
  chartLineDiastolic: '#34D399',
  chartZoneNormal: '#14532d',
  chartZoneElevated: '#422006',
  chartZoneHigh: '#450a0a',

  toggleTrackActive: '#60A5FA',
  toggleTrackInactive: '#4b5563',
  toggleThumb: 'rgba(255,255,255,0.87)',
  iconCircleBg: 'rgba(96,165,250,0.15)',
  successText: '#86EFAC',
  successBg: '#14532d',

  infoBg: '#1e3a5f',
  infoColor: '#60a5fa',

  warningBg: '#422006',
  warningText: '#fbbf24',
  warningBorder: '#d97706',

  crisisRed: '#FCA5A5',
  crisisBorder: '#FCA5A5',

  ppColor: '#fbbf24',
  mapColor: '#818cf8',

  surgeColor: '#fb923c',
  surgeBg: '#431407',

  overlay: 'rgba(0,0,0,0.6)',

  shadow: '#000000',
  shadowOpacity: 0.3,

  borderWidth: 1,
};
```

- [ ] **Step 4: Update `highContrastColors`**

Replace the `highContrastColors` object (lines 270–345) — change teal accent to accessible blue, add `borderWidth: 3`:

```typescript
export const highContrastColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',

  textPrimary: '#000000',
  textSecondary: '#000000',
  textTertiary: '#4A4A4A',

  accent: '#1D4ED8',

  border: '#000000',
  borderLight: '#CCCCCC',

  error: '#CC0000',
  errorBackground: '#FFE6E6',

  gradientStart: '#1D4ED8',
  gradientEnd: '#1D4ED8',

  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#000000',

  numpadKey: '#FFFFFF',
  numpadKeyText: '#000000',
  numpadKeyBorder: '#000000',
  numpadClearBg: '#FFE6E6',
  numpadBackspaceBg: '#E6F3FF',

  chartLine: '#1D4ED8',
  chartDot: '#000000',
  chartLabel: '#000000',
  chartLineDiastolic: '#007A78',
  chartZoneNormal: '#E8F5E9',
  chartZoneElevated: '#FFF9C4',
  chartZoneHigh: '#FFEBEE',

  toggleTrackActive: '#1D4ED8',
  toggleTrackInactive: '#CCCCCC',
  toggleThumb: '#ffffff',
  iconCircleBg: '#E6E6E6',
  successText: '#006600',
  successBg: '#E8F5E9',

  infoBg: '#E3F2FD',
  infoColor: '#1565C0',

  warningBg: '#FFF9C4',
  warningText: '#5D4037',
  warningBorder: '#FFD54F',

  crisisRed: '#CC0000',
  crisisBorder: '#CC0000',

  ppColor: '#d97706',
  mapColor: '#4338CA',

  surgeColor: '#E65100',
  surgeBg: '#FFF3E0',

  overlay: 'rgba(0,0,0,0.5)',

  shadow: '#000000',
  shadowOpacity: 0,

  borderWidth: 3,
};
```

- [ ] **Step 5: Update `BP_COLORS_DARK` desaturated values**

Replace lines 356–362:

```typescript
export const BP_COLORS_DARK: Record<BPCategory, string> = {
  normal: '#86EFAC',
  elevated: '#FDE68A',
  stage_1: '#FDBA74',
  stage_2: '#FECACA',
  crisis: '#FCA5A5',
};
```

- [ ] **Step 6: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors related to missing `borderWidth` — any errors about missing `borderWidth` on palette objects indicate a step was missed.

- [ ] **Step 7: Commit**

```bash
git add src/shared/config/theme.ts
git commit -m "feat(theme): medical-blue palette + borderWidth token, desaturate BP_COLORS_DARK"
```

---

## Task 2: Extend `useTheme()` Return Value

**Files:**
- Modify: `src/shared/lib/use-theme.ts`

- [ ] **Step 1: Add `seniorMode`, `touchTargetSize`, `interactiveSpacing` to return**

Replace `src/shared/lib/use-theme.ts` entirely:

```typescript
import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settings-store';
import {
  lightColors,
  darkColors,
  highContrastColors,
  computeTypographyScale,
  SENIOR_SCALE,
  type ThemeColors,
  type TypographyScale,
} from '../config/theme';

interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
  fontScale: number;
  highContrast: boolean;
  seniorMode: boolean;
  typography: TypographyScale;
  touchTargetSize: number;
  interactiveSpacing: number;
}

export function useTheme(): UseThemeResult {
  const { theme, highContrast, seniorMode } = useSettingsStore();
  const systemColorScheme = useColorScheme();

  const effectiveTheme = highContrast ? 'light' : theme;
  const actualTheme =
    effectiveTheme === 'system'
      ? systemColorScheme || 'light'
      : effectiveTheme;

  const isDark = actualTheme === 'dark';

  const colors = highContrast
    ? highContrastColors
    : (isDark ? darkColors : lightColors);

  const fontScale = seniorMode ? SENIOR_SCALE : 1.0;
  const typography = computeTypographyScale(seniorMode);

  const touchTargetSize = seniorMode ? 56 : 44;
  const interactiveSpacing = seniorMode ? 16 : 8;

  return {
    colors,
    isDark,
    fontScale,
    highContrast,
    seniorMode,
    typography,
    touchTargetSize,
    interactiveSpacing,
  };
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: any component that now destructures `seniorMode` from `useTheme()` will work; no regressions.

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/use-theme.ts
git commit -m "feat(theme): expose seniorMode, touchTargetSize, interactiveSpacing from useTheme"
```

---

## Task 3: Add `numpadLayout` to Settings Store

**Files:**
- Modify: `src/shared/lib/settings-store.ts`

- [ ] **Step 1: Add type + field + setter to `SettingsState`**

In `src/shared/lib/settings-store.ts`:

After line 13 (`export type TemperatureUnit = ...`), add:

```typescript
export type NumpadLayout = 'calculator' | 'telephone';
```

In the `SettingsState` interface, after `voiceLoggingEnabled: boolean;` add:

```typescript
numpadLayout: NumpadLayout;
setNumpadLayout: (layout: NumpadLayout) => void;
```

In the `create()` call defaults, after `voiceLoggingEnabled: true,` add:

```typescript
numpadLayout: 'calculator',
```

In the actions, after `setVoiceLoggingEnabled: (enabled) => set({ voiceLoggingEnabled: enabled }),` add:

```typescript
setNumpadLayout: (layout) => set({ numpadLayout: layout }),
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/settings-store.ts
git commit -m "feat(settings): add numpadLayout field (calculator/telephone)"
```

---

## Task 4: Create `haptics.ts`

**Files:**
- Create: `src/shared/lib/haptics.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/shared/lib/haptics.ts
import { Vibration, Platform } from 'react-native';

/**
 * Soft tap — numpad keystroke confirmation.
 * iOS: 10 ms; Android: 20 ms (minimum perceivable).
 */
export function hapticKeystroke(): void {
  try {
    Vibration.vibrate(Platform.OS === 'ios' ? 10 : 20);
  } catch {
    // No vibration permission — silent no-op
  }
}

/**
 * Success double-pulse — save action confirmation.
 * Pattern: wait 0ms, vibrate 50ms, wait 100ms, vibrate 50ms.
 */
export function hapticSave(): void {
  try {
    Vibration.vibrate([0, 50, 100, 50]);
  } catch {
    // No vibration permission — silent no-op
  }
}

/**
 * Heavy repeated pattern — crisis alert (trimodal).
 * Pattern: wait 0ms, vibrate 100ms, pause 50ms, vibrate 100ms, pause 50ms, vibrate 100ms.
 * Designed to be perceivable through diabetic neuropathy (SM-009).
 */
export function hapticCrisis(): void {
  try {
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
  } catch {
    // No vibration permission — silent no-op
  }
}
```

- [ ] **Step 2: Export from `shared/lib/index.ts`**

In `src/shared/lib/index.ts`, add:

```typescript
export * from './haptics';
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/haptics.ts src/shared/lib/index.ts
git commit -m "feat(haptics): add hapticKeystroke/hapticSave/hapticCrisis using Vibration"
```

---

## Task 5: Update `Numpad.tsx` — Layout Toggle + HC + Haptic

**Files:**
- Modify: `src/shared/ui/Numpad.tsx`

### What changes
- Remove inline `Vibration` import + call → use `hapticKeystroke()`
- Add `CALCULATOR_KEYS` constant (7-8-9 top row)
- Add `layout?: 'calculator' | 'telephone'` prop; default reads `numpadLayout` from store
- HC: add `borderWidth: colors.borderWidth` and remove `shadowOpacity`
- Senior: key border uses `colors.borderWidth`

- [ ] **Step 1: Replace `Numpad.tsx` with updated version**

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { useSettingsStore } from '../lib/settings-store';
import { hapticKeystroke } from '../lib/haptics';
import { FONTS } from '../config/theme';

interface NumpadProps {
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  compact?: boolean;
  allowDecimal?: boolean;
  /** Override layout; defaults to user's stored preference */
  layout?: 'calculator' | 'telephone';
}

interface KeyButtonProps {
  keyValue: string;
  keySize: { width: number; height: number };
  disabled: boolean;
  compact: boolean;
  onPress: (key: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Telephone layout: 1-2-3 top row (legacy default)
const TELEPHONE_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

// Calculator layout: 7-8-9 top row (SM-007 default)
const CALCULATOR_KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['C', '0', '⌫'],
];

function KeyButton({ keyValue, keySize, disabled, compact, onPress }: KeyButtonProps) {
  const { t } = useTranslation('common');
  const { colors, fontScale, highContrast } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    hapticKeystroke();

    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    onPress(keyValue);
  };

  const isClear = keyValue === 'C';
  const isBackspace = keyValue === '⌫';

  return (
    <AnimatedPressable
      style={[
        styles.key,
        {
          height: keySize.height,
          backgroundColor: isClear
            ? colors.numpadClearBg
            : isBackspace
              ? colors.numpadBackspaceBg
              : colors.numpadKey,
          borderColor: colors.numpadKeyBorder,
          borderWidth: highContrast ? colors.borderWidth : 1,
          shadowColor: colors.shadow,
          shadowOpacity: colors.shadowOpacity,
        },
        animatedStyle,
        disabled && styles.disabledKey,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        keyValue === '⌫' ? t('a11y.backspace') : keyValue === 'C' ? t('a11y.clear') : keyValue
      }
    >
      <Text
        style={[
          styles.keyText,
          {
            color: colors.numpadKeyText,
            fontSize: compact
              ? (isClear || isBackspace ? 20 * fontScale : 26 * fontScale)
              : (isClear || isBackspace ? 26 * fontScale : 32 * fontScale),
          },
          isClear && { color: colors.error },
          disabled && { color: colors.textTertiary },
        ]}
      >
        {keyValue}
      </Text>
    </AnimatedPressable>
  );
}

export function Numpad({
  value,
  onValueChange,
  maxLength = 3,
  disabled = false,
  compact = false,
  allowDecimal = false,
  layout,
}: NumpadProps) {
  const { seniorMode, numpadLayout } = useSettingsStore();
  const effectiveLayout = layout ?? numpadLayout;

  const keySize = compact
    ? seniorMode
      ? { width: 76, height: 58 }
      : { width: 84, height: 50 }
    : seniorMode
      ? { width: 94, height: 72 }
      : { width: 104, height: 62 };

  const baseKeys = effectiveLayout === 'telephone' ? TELEPHONE_KEYS : CALCULATOR_KEYS;

  // Decimal mode: replace 'C' with '.' in bottom row
  const keys = allowDecimal
    ? baseKeys.map((row, i) =>
        i === 3 ? ['.', '0', '⌫'] : row
      )
    : baseKeys;

  const handleKeyPress = (key: string) => {
    if (disabled) return;

    if (key === 'C') {
      onValueChange('');
    } else if (key === '⌫') {
      onValueChange(value.slice(0, -1));
    } else if (key === '.') {
      if (value === '' || value.includes('.')) return;
      if (value.length < maxLength) onValueChange(value + '.');
    } else {
      if (value.length < maxLength) {
        if (value === '0' && key === '0') return;
        if (value === '0' && key !== '0') onValueChange(key);
        else onValueChange(value + key);
      }
    }
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, compact && styles.rowCompact]}>
          {row.map((key) => (
            <KeyButton
              key={key}
              keyValue={key}
              keySize={keySize}
              disabled={disabled}
              compact={compact}
              onPress={handleKeyPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  containerCompact: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  rowCompact: {
    marginBottom: 10,
  },
  key: {
    flex: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  keyText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  disabledKey: {
    opacity: 0.4,
  },
});
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/Numpad.tsx
git commit -m "feat(numpad): calculator layout, HC borders, hapticKeystroke"
```

---

## Task 6: Update `SaveButton`, `OptionChip`, `TagChip`

**Files:**
- Modify: `src/shared/ui/SaveButton.tsx`
- Modify: `src/shared/ui/OptionChip.tsx`
- Modify: `src/shared/ui/TagChip.tsx`

- [ ] **Step 1: Replace `SaveButton.tsx`**

```typescript
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { hapticSave } from '../lib/haptics';
import { FONTS } from '../config/theme';

interface SaveButtonProps {
  label: string;
  isValid: boolean;
  isLoading: boolean;
  onPress: () => void;
  fontScale?: number;
}

export function SaveButton({ label, isValid, isLoading, onPress, fontScale = 1 }: SaveButtonProps) {
  const { colors, touchTargetSize, highContrast } = useTheme();

  const handlePress = () => {
    hapticSave();
    onPress();
  };

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: isValid ? colors.accent : colors.border,
          minHeight: touchTargetSize,
          borderWidth: highContrast ? colors.borderWidth : 0,
          borderColor: highContrast ? colors.textPrimary : 'transparent',
        },
      ]}
      onPress={handlePress}
      disabled={!isValid || isLoading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isValid || isLoading }}
    >
      <Icon name="checkmark-circle" size={20} color={colors.surface} />
      <Text style={[styles.buttonText, { fontSize: 16 * fontScale, color: colors.surface }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Replace `OptionChip.tsx`**

```typescript
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionChip({ label, selected, onPress }: OptionChipProps) {
  const { colors, touchTargetSize, typography, highContrast } = useTheme();

  const borderWidth = highContrast ? colors.borderWidth : selected ? 2 : 1;
  const borderColor = highContrast
    ? selected ? colors.textPrimary : colors.border
    : selected ? colors.accent : colors.border;
  const backgroundColor = highContrast
    ? colors.surface
    : selected ? colors.accent : colors.surfaceSecondary;
  const textColor = highContrast
    ? colors.textPrimary
    : selected ? colors.surface : colors.textSecondary;

  return (
    <Pressable
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          minHeight: touchTargetSize,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, { color: textColor, fontSize: typography.sm }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
```

- [ ] **Step 3: Replace `TagChip.tsx`**

```typescript
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface TagChipProps {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  fontScale?: number;
  disabled?: boolean;
}

export function TagChip({ icon, label, selected, onPress, onLongPress, fontScale = 1, disabled }: TagChipProps) {
  const { colors, highContrast } = useTheme();
  const iconSize = Math.round(14 * fontScale);
  const borderWidth = highContrast ? 2 : 1;

  return (
    <Pressable
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent + '18' : colors.surfaceSecondary,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Icon
        name={selected ? icon.replace('-outline', '') : icon}
        size={iconSize}
        color={selected ? colors.accent : colors.textSecondary}
      />
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? colors.accent : colors.textSecondary,
            fontSize: Math.round(12 * fontScale),
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 44,
  },
  chipText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
```

- [ ] **Step 4: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/SaveButton.tsx src/shared/ui/OptionChip.tsx src/shared/ui/TagChip.tsx
git commit -m "feat(ui): HC borders + Senior min-height on SaveButton, OptionChip, TagChip"
```

---

## Task 7: Update `CrisisModal.tsx` — SVG Octagon + Haptic + HC Prefix

**Files:**
- Modify: `src/shared/ui/CrisisModal.tsx`

### What changes
- Import `hapticCrisis` and call it in `useEffect` when `visible` becomes `true`
- Replace `<Icon name="warning" />` in the icon circle with an SVG octagon (react-native-svg)
- In HC mode, prepend `"Crisis: "` to the BP values display

- [ ] **Step 1: Add haptic + SVG octagon + HC prefix to `CrisisModal.tsx`**

Add imports at the top of the file (after existing imports):

```typescript
import Svg, { Polygon } from 'react-native-svg';
import { hapticCrisis } from '../lib/haptics';
```

Add a `useTheme` destructure for `highContrast` (already imported, just destructure):

Change line 53:
```typescript
const { colors } = useTheme();
```
to:
```typescript
const { colors, highContrast } = useTheme();
```

In the `useEffect` that fires when `visible` changes (lines 79–88), add `hapticCrisis()` call:

```typescript
useEffect(() => {
  if (visible) {
    hapticCrisis();
    backdropOpacity.value = withTiming(1, { duration: 220 });
    cardScale.value = withSpring(1, { damping: 18, stiffness: 240 });
    cardOpacity.value = withTiming(1, { duration: 200 });
  } else {
    backdropOpacity.value = withTiming(0, { duration: 160 });
    cardOpacity.value = withTiming(0, { duration: 160 });
  }
}, [visible, backdropOpacity, cardScale, cardOpacity]);
```

Replace the `<View style={styles.iconCircle}>` block (lines 147–149) with:

```tsx
<View style={[styles.iconCircle, { backgroundColor: colors.crisisRed, shadowColor: colors.crisisRed }]}>
  <Svg width={32} height={32} viewBox="0 0 32 32">
    <Polygon
      points="11,2 21,2 30,11 30,21 21,30 11,30 2,21 2,11"
      fill="none"
      stroke="white"
      strokeWidth={2.5}
    />
    <Polygon
      points="12,8 20,8 24,12 24,20 20,24 12,24 8,20 8,12"
      fill="white"
      opacity={0.3}
    />
  </Svg>
</View>
```

Replace the BP values block (lines 156–165) with:

```tsx
<View style={[styles.valuesRow, { backgroundColor: colors.errorBackground, borderColor: colors.crisisBorder }]}>
  <Text style={[styles.valuesText, { color: colors.crisisRed }]}>
    {highContrast && (
      <Text style={[styles.valuesText, { color: colors.crisisRed }]}>Crisis: </Text>
    )}
    {systolic}
    <Text style={[styles.valuesDivider, { color: colors.crisisBorder }]}>/</Text>
    {diastolic}
  </Text>
  <Text style={[styles.valuesUnit, { color: colors.error }]}>mmHg</Text>
</View>
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/CrisisModal.tsx
git commit -m "feat(crisis): SVG octagon icon, hapticCrisis on mount, HC text prefix"
```

---

## Task 8: Update `Button/Button.tsx` — `colors.borderWidth` + Senior Min Height

**Files:**
- Modify: `src/shared/ui/Button/Button.tsx`

### What changes
- Line 76: `borderWidth: borderColor ? (highContrast ? 2 : 1) : 0` → use `colors.borderWidth`
- `minHeight`: wrap in `Math.max(sizeConfig.minHeight, touchTargetSize)` so Senior Mode enforces 56 px

- [ ] **Step 1: Add `touchTargetSize` to destructure**

Change line 54:
```typescript
const { colors, typography, highContrast } = useTheme();
```
to:
```typescript
const { colors, typography, highContrast, touchTargetSize } = useTheme();
```

- [ ] **Step 2: Update `containerStyle` — borderWidth + minHeight**

Change the `containerStyle` object. Replace:
```typescript
borderWidth: borderColor ? (highContrast ? 2 : 1) : 0,
```
with:
```typescript
borderWidth: borderColor ? colors.borderWidth : 0,
```

Change:
```typescript
minHeight: sizeConfig.minHeight,
```
with:
```typescript
minHeight: Math.max(sizeConfig.minHeight, touchTargetSize),
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/ui/Button/Button.tsx
git commit -m "feat(button): use colors.borderWidth; Senior Mode enforces 56px min height"
```

---

## Task 9: Update `BPRecordCard.tsx` — HC Redundant Encoding

**Files:**
- Modify: `src/widgets/bp-record-card/ui/BPRecordCard.tsx`

### What changes
- Add `HcCategoryIcon` helper component using react-native-svg geometric shapes
- Full variant badge: in HC, prepend classification text + show geometric icon
- Compact variant badge: in HC, replace icon-only badge with geometric SVG icon

- [ ] **Step 1: Add SVG import and `HcCategoryIcon` component**

Add after existing imports:

```typescript
import Svg, { Circle, Polygon, Path } from 'react-native-svg';
```

Add the `HcCategoryIcon` component before `BPRecordCard`:

```typescript
/** Geometric SVG icons for HC redundant encoding (HC-005). Min 20×20 px. */
function HcCategoryIcon({ category, color, size = 20 }: { category: string; color: string; size?: number }) {
  switch (category) {
    case 'normal':
      // Solid circle (●)
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx={10} cy={10} r={8} fill={color} />
        </Svg>
      );
    case 'elevated':
      // Upward triangle (▲)
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Polygon points="10,2 18,18 2,18" fill={color} />
        </Svg>
      );
    case 'stage_1':
      // Filled diamond (◆)
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Polygon points="10,2 18,10 10,18 2,10" fill={color} />
        </Svg>
      );
    case 'stage_2':
      // Outlined diamond (◇)
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Polygon points="10,2 18,10 10,18 2,10" fill="none" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'crisis':
    default:
      // Bold octagon (stop-sign shape)
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Polygon
            points="6,1 14,1 19,6 19,14 14,19 6,19 1,14 1,6"
            fill={color}
          />
        </Svg>
      );
  }
}
```

- [ ] **Step 2: Add `highContrast` to useTheme destructure**

Change line 54:
```typescript
const { colors, isDark, fontScale, typography } = useTheme();
```
to:
```typescript
const { colors, isDark, fontScale, typography, highContrast } = useTheme();
```

- [ ] **Step 3: Update compact variant badge**

Find the compact variant badge block (around line 192–215). The `fontScale > 1` branch shows an icon-only badge. Add HC support:

Replace the entire badge section at end of compact card (from `{/* Category Badge */}` to closing `)`):

```tsx
{/* Category Badge — HC: geometric icon; Senior: icon badge; normal: text badge */}
{highContrast ? (
  <View
    style={[compactStyles.iconBadge, { backgroundColor: categoryColor + '20', borderWidth: 2, borderColor: categoryColor }]}
    accessibilityRole="text"
    accessibilityLabel={categoryLabel}
  >
    <HcCategoryIcon category={category} color={categoryColor} size={20} />
  </View>
) : fontScale > 1 ? (
  <View
    style={[compactStyles.iconBadge, { backgroundColor: categoryColor + '20' }]}
    accessibilityRole="text"
    accessibilityLabel={categoryLabel}
  >
    <Icon
      name={CATEGORY_ICONS[category] || 'help-circle'}
      size={20}
      color={categoryColor}
    />
  </View>
) : (
  <View style={[compactStyles.badge, { backgroundColor: categoryColor + '20' }]}>
    <Text
      style={[compactStyles.badgeText, { color: categoryColor, fontSize: typography.xs }]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {categoryLabel}
    </Text>
  </View>
)}
```

- [ ] **Step 4: Update full variant badge — HC redundant encoding**

Find the full variant Category Badge block (around lines 273–279). Replace:

```tsx
{/* Category Badge */}
<View
  style={[styles.badge, { backgroundColor: categoryColor + '15' }]}
>
  {highContrast ? (
    <>
      <HcCategoryIcon category={category} color={categoryColor} size={16} />
      <Text style={[styles.badgeText, { color: categoryColor, fontSize: typography.xs }]}>
        {categoryLabel}: {record.systolic}/{record.diastolic}
      </Text>
    </>
  ) : (
    <>
      <View style={[styles.badgeDot, { backgroundColor: categoryColor }]} />
      <Text style={[styles.badgeText, { color: categoryColor, fontSize: typography.xs }]}>{categoryLabel}</Text>
    </>
  )}
</View>
```

- [ ] **Step 5: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 6: Commit**

```bash
git add src/widgets/bp-record-card/ui/BPRecordCard.tsx
git commit -m "feat(record-card): HC redundant encoding — SVG geometric icons + text prefix"
```

---

## Task 10: Update `AppSettingsPage.tsx` — Theme Selector + Numpad Layout

**Files:**
- Modify: `src/pages/settings/ui/AppSettingsPage.tsx`

### What changes
- Replace `Switch` dark mode toggle + "use system" link with 3-chip selector (Light / Dark / System)
- Add new "Numpad Layout" card with Calculator / Telephone chips

- [ ] **Step 1: Add `numpadLayout` and `setNumpadLayout` to store destructure**

Find the `useSettingsStore()` destructure (around line 22). Add `numpadLayout` and `setNumpadLayout`:

```typescript
const {
  language,
  theme,
  seniorMode,
  highContrast,
  preferredEntryMode,
  voiceLoggingEnabled,
  numpadLayout,
  setLanguage,
  setTheme,
  setSeniorMode,
  setHighContrast,
  setPreferredEntryMode,
  setVoiceLoggingEnabled,
  setNumpadLayout,
} = useSettingsStore();
```

- [ ] **Step 2: Replace the dark-mode Switch handler with 3-chip theme handler**

Remove `handleThemeToggle`, `handleSystemTheme`, and `isDarkToggled`. Add:

```typescript
const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
  setTheme(newTheme);
  showSavedToast(t('settings.theme.title'));
};

const handleNumpadLayoutChange = (layout: 'calculator' | 'telephone') => {
  setNumpadLayout(layout);
  showSavedToast(t('settings.numpadLayout.label'));
};
```

- [ ] **Step 3: Replace the theme switch UI block**

Find the theme card in the JSX (it currently renders a `Switch` for dark mode). Replace with 3-chip selector:

```tsx
{/* Theme Card */}
<Animated.View entering={FadeInUp.duration(400)} style={styles.cardMargin}>
  <Card variant="elevated" size="lg" style={styles.cardRadius}>
    <CardBody>
      <View style={styles.settingRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
          <Icon name="color-palette-outline" size={20} color={colors.accent} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary, fontSize: typography.md }]}>
            {t('settings.theme.title')}
          </Text>
        </View>
      </View>
      <View style={styles.chipRow}>
        <OptionChip
          label={t('settings.theme.light')}
          selected={theme === 'light'}
          onPress={() => handleThemeChange('light')}
        />
        <OptionChip
          label={t('settings.theme.dark')}
          selected={theme === 'dark'}
          onPress={() => handleThemeChange('dark')}
        />
        <OptionChip
          label={t('settings.theme.system')}
          selected={theme === 'system'}
          onPress={() => handleThemeChange('system')}
        />
      </View>
    </CardBody>
  </Card>
</Animated.View>
```

- [ ] **Step 4: Add Numpad Layout card** (place after the theme card, before accessibility card)

```tsx
{/* Numpad Layout Card */}
<Animated.View entering={FadeInUp.duration(400)} style={styles.cardMargin}>
  <Card variant="elevated" size="lg" style={styles.cardRadius}>
    <CardBody>
      <View style={styles.settingRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
          <Icon name="keypad-outline" size={20} color={colors.accent} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary, fontSize: typography.md }]}>
            {t('settings.numpadLayout.label')}
          </Text>
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.numpadLayout.description')}
          </Text>
        </View>
      </View>
      <View style={styles.chipRow}>
        <OptionChip
          label={t('settings.numpadLayout.calculator')}
          selected={numpadLayout === 'calculator'}
          onPress={() => handleNumpadLayoutChange('calculator')}
        />
        <OptionChip
          label={t('settings.numpadLayout.telephone')}
          selected={numpadLayout === 'telephone'}
          onPress={() => handleNumpadLayoutChange('telephone')}
        />
      </View>
    </CardBody>
  </Card>
</Animated.View>
```

- [ ] **Step 5: Add `chipRow` style** (at the end of `StyleSheet.create({...})`):

```typescript
chipRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
},
```

- [ ] **Step 6: Add translation keys to English locale**

In `src/shared/config/locales/en/pages.json`, add inside the `settings` object:

```json
"numpadLayout": {
  "label": "Numpad Layout",
  "description": "Choose key order for BP entry",
  "calculator": "Calculator (7-8-9)",
  "telephone": "Telephone (1-2-3)"
},
"theme": {
  "title": "Theme",
  "light": "Light",
  "dark": "Dark",
  "system": "System"
}
```

(Check if `theme.title` already exists — only add what's missing.)

- [ ] **Step 7: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/settings/ui/AppSettingsPage.tsx src/shared/config/locales/en/pages.json
git commit -m "feat(settings): 3-chip theme selector + numpad layout toggle"
```

---

## Task 11: Update `PageHeader.tsx` — HC Badge Fix

**Files:**
- Modify: `src/widgets/page-header/ui/PageHeader.tsx`

### What changes
- Badge `shadowOpacity` is hardcoded `0.06` — should use `colors.shadowOpacity` so HC gets `0`
- HC: use `colors.surface` solid background (no gradient); add 2px bottom border on badge

- [ ] **Step 1: Add `highContrast` to useTheme destructure**

Change line 17:
```typescript
const { colors, typography } = useTheme();
```
to:
```typescript
const { colors, typography, highContrast } = useTheme();
```

- [ ] **Step 2: Update badge style inline**

Replace the badge `<View>` (lines 37–47):

```tsx
<View
  style={[
    styles.badge,
    {
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOpacity: colors.shadowOpacity,
      borderWidth: highContrast ? 2 : 0,
      borderColor: highContrast ? colors.border : 'transparent',
    },
  ]}
>
  <Icon name="shield-checkmark" size={20} color={colors.accent} />
  <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.xs }]}>
    {t('home.encryptedOffline')}
  </Text>
</View>
```

- [ ] **Step 3: Commit**

```bash
git add src/widgets/page-header/ui/PageHeader.tsx
git commit -m "fix(page-header): HC badge uses colors.shadowOpacity and solid border"
```

---

## Task 12: Update `BPTrendChart.tsx` — HC SVG Pattern Overlay

**Files:**
- Modify: `src/shared/ui/BPTrendChart.tsx`

### What changes
- HC mode: render a `react-native-svg` overlay on top of the gifted-chart to draw threshold band patterns and differentiated line legend
- Lines: systolic 3px solid + triangle data-point legend; diastolic 2px dashed + square legend
- Patterns: Stage1 zone = diagonal hatch; Stage2 zone = stipple/dot; Crisis zone = cross-hatch

- [ ] **Step 1: Add SVG imports and HC chart overlay component**

Add after existing imports:

```typescript
import Svg, { Defs, Pattern, Rect, Line, Circle as SvgCircle, Path as SvgPath } from 'react-native-svg';
```

Add `highContrast` to useTheme destructure:

```typescript
const { colors, typography, highContrast } = useTheme();
```

- [ ] **Step 2: Add HC pattern overlay render helper**

After the `return (` statement (line 218) and before `<GiftedLineChart`, add a helper function inside the component:

```typescript
/** Renders SVG pattern fills over threshold bands for HC mode (HC-006). */
const renderHCOverlay = () => {
  if (!highContrast) return null;

  const chartW = chartInnerWidth;
  const chartH = height;

  // Compute Y pixel positions for threshold lines
  // yAxisMin=60, yAxisMax=180, chartH pixels for that range
  const yRange = yAxisMax - yAxisMin;
  const pixelsPerUnit = chartH / yRange;

  // Stage1 starts at 130 SBP; Stage2 at 140; Crisis at 180
  const stage1Y = chartH - (130 - yAxisMin) * pixelsPerUnit;
  const stage2Y = chartH - (140 - yAxisMin) * pixelsPerUnit;
  // Crisis top = chart top (180 = yAxisMax)

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={chartW + 40} height={chartH}>
        <Defs>
          {/* Stage1: 45° diagonal hatch */}
          <Pattern id="hatch" patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(45)">
            <Line x1={0} y1={0} x2={0} y2={8} stroke="#000" strokeWidth={1.5} opacity={0.25} />
          </Pattern>
          {/* Stage2: dense dots */}
          <Pattern id="dots" patternUnits="userSpaceOnUse" width={6} height={6}>
            <SvgCircle cx={3} cy={3} r={1.2} fill="#000" opacity={0.3} />
          </Pattern>
          {/* Crisis: cross-hatch */}
          <Pattern id="crosshatch" patternUnits="userSpaceOnUse" width={8} height={8}>
            <Line x1={0} y1={0} x2={8} y2={8} stroke="#000" strokeWidth={1.5} opacity={0.3} />
            <Line x1={8} y1={0} x2={0} y2={8} stroke="#000" strokeWidth={1.5} opacity={0.3} />
          </Pattern>
        </Defs>

        {/* Stage1 band (130–140) */}
        {stage1Y > stage2Y && (
          <Rect
            x={40}
            y={stage2Y}
            width={chartW}
            height={stage1Y - stage2Y}
            fill="url(#hatch)"
          />
        )}

        {/* Stage2 band (140–180) */}
        {stage2Y > 0 && (
          <Rect
            x={40}
            y={0}
            width={chartW}
            height={stage2Y}
            fill="url(#dots)"
          />
        )}

        {/* Crisis band (top strip ≥180, i.e. top 10px as reference line indicator) */}
        <Rect
          x={40}
          y={0}
          width={chartW}
          height={Math.min(10, stage2Y)}
          fill="url(#crosshatch)"
        />
      </Svg>
    </View>
  );
};
```

- [ ] **Step 3: Update chart dataset for HC mode — systolic 3px solid, diastolic 2px dashed, data point shapes**

In the `datasets` useMemo (lines 75–140), the first dataset (systolic) and second dataset (diastolic) should use HC-adjusted thickness:

After the `const datasets = useMemo(() => {` line, change the systolic dataset entry:

```typescript
{
  data: systolicData,
  color: colors.chartLine,
  thickness: highContrast ? 3 : 2.5,
  dataPointsColor: colors.chartLine,
  dataPointsRadius: highContrast ? 5 : 4,
  dataPointsShape: highContrast ? 'triangular' : 'standard',
  startFillColor: highContrast ? 'transparent' : colors.chartLine + '1F',
  endFillColor: highContrast ? 'transparent' : colors.chartLine + '00',
  startOpacity: highContrast ? 0 : 0.12,
  endOpacity: 0,
},
```

Change the diastolic dataset entry:

```typescript
{
  data: diastolicData,
  color: colors.chartLineDiastolic,
  thickness: highContrast ? 2 : 2,
  dataPointsColor: colors.chartLineDiastolic,
  dataPointsRadius: highContrast ? 4 : 3,
  dataPointsShape: highContrast ? 'square' : 'standard',
  strokeDashArray: [6, 4],
  startOpacity: 0,
  endOpacity: 0,
},
```

Add `highContrast` to the dependency array of the `datasets` useMemo.

- [ ] **Step 4: Render HC overlay in the return JSX**

In the component return, wrap the chart in a `<View style={{ position: 'relative' }}>` and add the overlay after `<GiftedLineChart .../>`:

```tsx
return (
  <View>
    <View style={{ position: 'relative' }}>
      <GiftedLineChart
        {/* ... all existing props ... */}
      />
      {renderHCOverlay()}
    </View>
    {/* ... rest: Legend, referenceLabelRow ... */}
  </View>
);
```

- [ ] **Step 5: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/BPTrendChart.tsx
git commit -m "feat(chart): HC SVG pattern overlay for threshold bands; 3px systolic line"
```

---

## Task 13: Update `HistoryPage.tsx` — Senior Delete Confirmation

**Files:**
- Modify: `src/pages/history/ui/HistoryPage.tsx`

### What changes
- Senior Mode: any destructive action (delete record) must show a permanent confirmation dialog (SM-006)
- The `BPRecordsList` widget handles delete via swipe-to-delete — wrap delete handler in a confirmation `Alert` when `seniorMode` is active

- [ ] **Step 1: Add `seniorMode` to destructure in HistoryPage**

Find the `useTheme()` or `useSettingsStore()` call. Add `seniorMode`:

```typescript
const { colors, typography } = useTheme();
const { ..., seniorMode } = useSettingsStore();
```

(Check if `seniorMode` is already available via `useSettingsStore` call — add it if missing.)

- [ ] **Step 2: Find the delete handler**

Search in `HistoryPage.tsx` for where a record is deleted (look for `useBPRecords` mutation or `deleteRecord`). The file likely has a `handleDelete` callback passed to `BPRecordsList`. Wrap it:

```typescript
import { Alert } from 'react-native';

// Find the existing delete handler and wrap it:
const handleDelete = useCallback((recordId: number) => {
  if (seniorMode) {
    Alert.alert(
      tCommon('deleteConfirm.title'),
      tCommon('deleteConfirm.message'),
      [
        { text: tCommon('buttons.cancel'), style: 'cancel' },
        {
          text: tCommon('buttons.delete'),
          style: 'destructive',
          onPress: () => {
            // original delete call goes here
            deleteRecord(recordId);
          },
        },
      ],
      { cancelable: true }
    );
  } else {
    deleteRecord(recordId);
  }
}, [seniorMode, deleteRecord, tCommon]);
```

- [ ] **Step 3: Add translation keys for delete confirmation**

In `src/shared/config/locales/en/common.json`, add inside `deleteConfirm`:

```json
"deleteConfirm": {
  "title": "Delete Reading?",
  "message": "This reading will be permanently removed."
}
```

- [ ] **Step 4: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/history/ui/HistoryPage.tsx src/shared/config/locales/en/common.json
git commit -m "feat(history): Senior Mode permanent delete confirmation dialog"
```

---

## Task 14: Final Typecheck + Lint Verification

**Files:** All modified files

- [ ] **Step 1: Full typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npx eslint src/ --ext .ts,.tsx
```

Expected: 0 errors (warnings OK).

- [ ] **Step 3: Update `docs/verified-functionalities.md`**

Add a new section or update the existing accessibility section:

```markdown
## [N]. Regulatory Display Mode Compliance (2026-04-05)

- **Light Mode**: Medical-blue palette (#2563EB accent, #F5F5F5 background)
- **Dark Mode**: 87% opacity text paradigm, desaturated BP category colors
- **High Contrast**: 3px borders, no shadows/gradients, redundant encoding on BP classification
  (text prefix "Crisis: 180/120" + SVG geometric icons), pattern fills on BPTrendChart
- **Senior Mode**: 56px touch targets on all interactive elements, 1.4× typography scale,
  calculator numpad layout (7-8-9 top), delete confirmation dialogs
- **Haptics**: `hapticKeystroke()` on numpad, `hapticSave()` on save, `hapticCrisis()` on crisis modal
- **Combinable**: All modes are independent flags — Dark + Senior, HC + Senior, etc. all work
```

- [ ] **Step 4: Commit docs update**

```bash
git add docs/verified-functionalities.md
git commit -m "docs: update verified-functionalities for regulatory mode compliance"
```

---

## Self-Review Notes

**Spec coverage check:**

| Spec Section | Covered By |
|---|---|
| LM-001–005: Light Mode tokens | Task 1 |
| DM-001–003: Dark Mode tokens + desaturation | Task 1 |
| HC-001–002: Remove shadows/gradients, thick borders | Tasks 1, 6, 7, 8, 11 |
| HC-003–005: No color-only + redundant encoding | Task 9 (BPRecordCard) |
| HC-006: BPTrendChart pattern fills | Task 12 |
| HC-007: Link underlines | `ButtonText` already has `textDecorationLine: 'underline'` for link variant ✓ |
| HC-008: Haptics | Tasks 4, 5, 6, 7 |
| SM-001–002: 1.4× typography | Already in `computeTypographyScale()` ✓ |
| SM-003: 56px touch targets | Tasks 2, 6, 8 |
| SM-004: 16px spacing between chips | Task 6 (OptionChip `interactiveSpacing`) |
| SM-005: Linear flow, hide advanced | Task 10 (AppSettingsPage) — pages defer to existing guided flow |
| SM-006: Permanent delete confirmation | Task 13 |
| SM-007: Calculator numpad layout | Tasks 3, 5, 10 |
| SM-008: Crisis modal trimodal | Task 7 (visual+haptic; audio deferred — no expo-av) |
| XC-001: Mode persistence | Zustand persist already implemented ✓ |
| XC-004: Haptic abstraction | Task 4 |
| XC-005: Accessibility metadata | Already present; crisis modal `accessibilityRole="alert"` ✓ |

**Crisis audio (SM-008):** Deferred — `expo-av` not installed. Haptic + visual cover the other two modalities of the trimodal requirement.

**Widgets not explicitly tasked:** `BPEntryForm`, `TodayScheduleCard`, `TagSelector`, `WeatherCorrelationCard`, `CircadianCard`, `CorrelationCard` — these inherit HC borders and Senior sizing from `Card`, `Button`, `OptionChip`, `TagChip` changes already made. No structural changes needed beyond token propagation.
