# Senior Mode & High Contrast Design Document

**Date:** 2026-02-11
**Status:** Approved
**Phase:** Phase 1 - Senior-Centric Manual Entry

## Overview

Implementation of two independent accessibility features to improve MedTracker usability for elderly users and those with vision impairments:

1. **Senior Mode**: Larger touch targets and text for easier interaction
2. **High Contrast Mode**: Maximum contrast (black-on-white) for medical readability

## Requirements

### Senior Mode
- Numpad buttons scale from 76x64 → 90x80
- Font scaling +20% (1.2x multiplier) for critical UI:
  - Numpad button text
  - BP value displays
  - Input field labels
  - Button labels
  - Category badges
- Secondary text unchanged (timestamps, footer text)

### High Contrast Mode
- Forces Light Mode (overrides theme setting)
- Pure black (#000000) text on white (#FFFFFF) background
- Removes gradients (solid colors)
- Bold borders (no subtle grays)
- No shadows (shadowOpacity: 0)
- Medical-grade contrast for critical readings

### Design Decisions

**Two Independent Toggles** (not combined)
- Allows users to enable Senior Mode without High Contrast
- Allows users to enable High Contrast without Senior Mode
- Maximum flexibility for different accessibility needs

**High Contrast Forces Light Mode**
- Medical device standard: black text on white for critical information
- Simpler implementation (one high-contrast palette)
- Maximum readability for vision-impaired users

**Strategic Font Scaling** (not global)
- Only scales interactive and critical elements
- Prevents layout overflow issues
- Maintains visual hierarchy

## Architecture (FSD-Compliant)

### 1. Settings Store Updates
**File:** `src/shared/lib/settings-store.ts`

```typescript
interface SettingsState {
  // ... existing fields
  seniorMode: boolean;
  highContrast: boolean;
  setSeniorMode: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

// Defaults
{
  seniorMode: false,
  highContrast: false,
  setSeniorMode: (enabled) => set({ seniorMode: enabled }),
  setHighContrast: (enabled) => set({ highContrast: enabled }),
}
```

**Storage:** Persisted via Zustand + AsyncStorage (existing middleware)
**Key:** `medtracker-settings` (no migration needed)

### 2. Theme System Updates
**File:** `src/shared/lib/use-theme.ts`

Enhanced hook signature:
```typescript
export function useTheme() {
  const { theme, highContrast, seniorMode } = useSettingsStore();

  // High Contrast forces Light Mode
  const effectiveTheme = highContrast ? 'light' : theme;

  const colors = highContrast
    ? highContrastColors
    : (isDark ? darkColors : lightColors);

  const fontScale = seniorMode ? 1.2 : 1.0;

  return { colors, isDark, fontScale, highContrast };
}
```

**Breaking Change:** None (backward compatible)
**New Return Values:**
- `fontScale: number` — 1.0 (normal) or 1.2 (senior mode)
- `highContrast: boolean` — For components that need to know

### 3. High-Contrast Color Palette
**File:** `src/shared/config/theme.ts`

```typescript
export const highContrastColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',

  textPrimary: '#000000',
  textSecondary: '#000000',
  textTertiary: '#4A4A4A',

  accent: '#0D9488',

  border: '#000000',
  borderLight: '#CCCCCC',

  error: '#CC0000',
  errorBackground: '#FFE6E6',

  // Solid colors (no gradients)
  gradientStart: '#0D9488',
  gradientEnd: '#0D9488', // Same = solid

  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#000000',

  numpadKey: '#FFFFFF',
  numpadKeyText: '#000000',
  numpadKeyBorder: '#000000',
  numpadClearBg: '#FFE6E6',
  numpadBackspaceBg: '#E6F3FF',

  chartLine: '#0D9488',
  chartDot: '#000000',
  chartLabel: '#000000',
  chartLineDiastolic: '#14B8A6',
  chartZoneNormal: '#E8F5E9',
  chartZoneElevated: '#FFF9C4',
  chartZoneHigh: '#FFEBEE',

  toggleTrackActive: '#0D9488',
  toggleTrackInactive: '#CCCCCC',
  iconCircleBg: '#E6E6E6',
  successText: '#006600',

  overlay: 'rgba(0,0,0,0.5)',

  shadow: '#000000',
  shadowOpacity: 0, // No shadows
};
```

### 4. Component Updates

#### A) Numpad Component
**File:** `src/shared/ui/Numpad.tsx`

```typescript
export function Numpad({ value, onValueChange, maxLength, disabled }: NumpadProps) {
  const { colors, fontScale } = useTheme();
  const { seniorMode } = useSettingsStore();

  const keySize = seniorMode
    ? { width: 90, height: 80 }
    : { width: 76, height: 64 };

  // Apply to button size:
  style={{ width: keySize.width, height: keySize.height }}

  // Apply to font size:
  style={{ fontSize: 28 * fontScale }}
}
```

#### B) Other Critical Components

**Apply `fontScale` to:**
- HomePage BP display: `fontSize: 48 * fontScale`
- Input labels (NewReading, QuickLog): `fontSize: 18 * fontScale`
- Button labels: `fontSize: 18 * fontScale`
- Category badges: `fontSize: 16 * fontScale`

**Don't scale:**
- Timestamps
- Footer text
- Secondary descriptions

### 5. Settings Page UI
**File:** `src/pages/settings/ui/SettingsPage.tsx`

Add two new settings cards after Theme setting:

```typescript
{/* Senior Mode Toggle */}
<SettingCard>
  <View style={styles.settingRow}>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
        {t('pages:settings.seniorMode.label')}
      </Text>
      <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
        {t('pages:settings.seniorMode.description')}
      </Text>
    </View>
    <Switch
      value={seniorMode}
      onValueChange={setSeniorMode}
      trackColor={{ true: colors.toggleTrackActive, false: colors.toggleTrackInactive }}
    />
  </View>
</SettingCard>

{/* High Contrast Toggle */}
<SettingCard>
  <View style={styles.settingRow}>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
        {t('pages:settings.highContrast.label')}
      </Text>
      <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
        {t('pages:settings.highContrast.description')}
      </Text>
      {highContrast && (
        <Text style={[styles.noteText, { color: colors.accent }]}>
          {t('pages:settings.highContrast.note')}
        </Text>
      )}
    </View>
    <Switch
      value={highContrast}
      onValueChange={setHighContrast}
      trackColor={{ true: colors.toggleTrackActive, false: colors.toggleTrackInactive }}
    />
  </View>
</SettingCard>
```

### 6. Translation Keys
**File:** `src/shared/config/locales/en/pages.json`

```json
{
  "settings": {
    "seniorMode": {
      "label": "Senior Mode",
      "description": "Larger buttons and text for easier reading"
    },
    "highContrast": {
      "label": "High Contrast",
      "description": "Black text on white background for maximum readability",
      "note": "⚠️ Forces light mode when enabled"
    }
  }
}
```

**Note:** Per CLAUDE.md Section 7, only add to English (`en/`). Other languages (tr, id, sr) translated separately.

## Implementation Checklist

- [ ] Update `settings-store.ts` (add seniorMode, highContrast)
- [ ] Update `theme.ts` (add highContrastColors palette)
- [ ] Update `use-theme.ts` (return fontScale, handle highContrast)
- [ ] Update `Numpad.tsx` (dynamic sizing, font scaling)
- [ ] Update HomePage BP display (font scaling)
- [ ] Update NewReadingPage inputs (font scaling)
- [ ] Update QuickLogPage inputs (font scaling)
- [ ] Update Button components (font scaling)
- [ ] Update Category badges (font scaling)
- [ ] Update SettingsPage (add two toggles)
- [ ] Update `en/pages.json` (add translation keys)
- [ ] Test Senior Mode toggle (verify numpad size, fonts)
- [ ] Test High Contrast toggle (verify black-on-white, no gradients)
- [ ] Test combination (both enabled simultaneously)
- [ ] Test persistence (restart app, settings preserved)

## FSD Compliance

| Layer | Files Modified/Created | Compliance |
|-------|----------------------|------------|
| `shared/lib` | `settings-store.ts`, `use-theme.ts` | ✓ Core infrastructure |
| `shared/config` | `theme.ts` | ✓ Theme definitions |
| `shared/ui` | `Numpad.tsx` | ✓ Reusable component |
| `pages/settings` | `SettingsPage.tsx` | ✓ Full screen |
| `pages/home` | `HomePage.tsx` | ✓ Full screen |
| `pages/new-reading` | `NewReadingPage.tsx` | ✓ Full screen |
| `pages/quick-log` | `QuickLogPage.tsx` | ✓ Full screen |

**No cross-layer violations** — all imports flow downward per FSD rules.

## Medical Compliance

**High Contrast Mode aligns with:**
- ISO 9241-3 (Visual Display Requirements)
- WCAG 2.1 Level AAA (Contrast ratio 7:1+)
- Medical device display standards (black-on-white for critical readings)
- AHA/ACC guideline presentation requirements

**Senior Mode aligns with:**
- WCAG 2.1 Touch Target Size (minimum 44x44 CSS pixels)
- 90x80 exceeds minimum for senior users
- Reduced fine motor skill requirements

## Testing Strategy

### Manual Testing
1. Enable Senior Mode → Verify numpad buttons are larger (90x80)
2. Enable Senior Mode → Verify BP values are 20% larger
3. Enable High Contrast → Verify theme switches to light mode
4. Enable High Contrast → Verify no gradients (HomePage card solid color)
5. Enable both → Verify both features work together
6. Disable both → Verify app returns to normal state
7. Restart app → Verify settings persist

### Accessibility Testing
- Test with iOS VoiceOver (screen reader labels correct)
- Test with Android TalkBack (screen reader labels correct)
- Visual contrast check (black-on-white passes WCAG AAA)
- Touch target measurement (≥44dp for all interactive elements)

## Future Enhancements (Post-Phase 1)

- **Voice Feedback**: Announce BP values when entered (TTS integration)
- **Haptic Patterns**: Different vibration patterns for different actions
- **Extra-Large Mode**: 1.5x font scaling option (beyond 1.2x)
- **Configurable Touch Target Size**: Slider to adjust button size (80-100dp)

## References

- CLAUDE.md Section 5: UI/UX Guidelines (Senior-Centric Design)
- CLAUDE.md Section 11: Dark Mode & Theme System
- CLAUDE.md Section 16: Strategic Roadmap (Phase 1 Priorities)
- WCAG 2.1 Accessibility Guidelines
- ISO 9241-3 Visual Display Requirements

---

**Approved By:** User
**Implementation Status:** Ready for development
**Estimated Effort:** 4-6 hours (FSD-compliant, well-scoped)
