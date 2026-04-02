# Region Detection Feedback Banner

**Date:** 2026-03-30
**Status:** Approved

## Problem

When the user taps "Detect My Region", the app silently applies a guideline (or defaults to AHA/ACC if the device locale has no country code). There is no feedback showing what country was detected or which standard was applied. In cases like North Macedonia, the locale may return an empty `countryCode`, causing an unexpected AHA/ACC default despite the mapping being correct for `MK` → ESC/ESH.

## Solution

Show an inline detection result banner **below the "Detect My Region" button** after it is pressed. The banner displays:

1. **Country name** — derived from `countryCode` via `Intl.DisplayNames`. If `countryCode` is empty, show "Region not detected".
2. **Guideline applied** — e.g. "ESC/ESH (2018)" or "AHA/ACC (2025)".
3. **Disclaimer** — "Please double-check with your doctor."

The banner is hidden until the button is first pressed. It persists until the user navigates away.

## Data Flow

```
handleDetectRegion()
  → getLocales()[0]?.countryCode ?? ''
  → getSettingsForRegion(countryCode)     ← existing logic, unchanged
  → setDetectionResult({ countryCode, guideline })   ← new state
  → apply settings (existing behavior, unchanged)

render:
  detectionResult != null
    → show banner with countryName + guidelineName + disclaimer
```

## Component Changes

### `ClassificationPage.tsx`

- Add `detectionResult` state: `{ countryCode: string; guideline: string } | null`
- Set it at the end of `handleDetectRegion` (always set, regardless of changed/no-change)
- Render info banner below the detect button inside the Guideline Card

### Banner UI

```
┌─────────────────────────────────────────┐
│ ℹ️  North Macedonia · ESC/ESH (2018)    │
│    Please double-check with your doctor │
└─────────────────────────────────────────┘
```

- Small filled/tinted card using `colors.surface` with accent left border
- Icon: `information-circle-outline` from Ionicons
- Country name: `Intl.DisplayNames` with current i18n language, fallback to countryCode or "Unknown region"
- Guideline name: from existing `guidelineNameMap`
- Disclaimer: new i18n key `settings.detectRegion.disclaimer`

## i18n Changes (English only)

Add to `pages.json` under `settings.detectRegion`:

```json
"detected": "{{country}} · {{guideline}}",
"unknownRegion": "Region not detected · Defaulted to AHA/ACC",
"disclaimer": "Please double-check with your doctor"
```

## What Is NOT Changed

- `getSettingsForRegion()` logic — already correct, `MK` maps to ESC/ESH
- Existing toast messages (updated / noChange)
- All other settings behavior
