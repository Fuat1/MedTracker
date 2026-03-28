# Android Voice Logging — Design Spec

**Date:** 2026-03-28
**Status:** Approved

---

## Overview

Add Google Assistant App Actions to MedTracker for Android so users can say "Hey Google, log blood pressure 120 over 80 pulse 72" and land on the VoiceConfirmationPage with values pre-filled — mirroring the existing iOS Siri Shortcuts integration.

The app is not yet on the Play Store. All implementation is complete now; the "Hey Google" voice trigger activates once published.

---

## Architecture

### Hybrid BII Strategy

Two Google App Actions capabilities declared side by side in `shortcuts.xml`:

**Primary: `actions.intent.RECORD_HEALTH_OBSERVATION`**
- Semantically correct for health data
- Google Assistant extracts numbers natively from "120 over 80"
- Parameter mapping:
  - `healthObservation.highValue` → `sys`
  - `healthObservation.lowValue` → `dia`
  - `healthObservation.value` → `pulse` (optional)
- URL template: `medtracker://log?sys={sys}&dia={dia}&pulse={pulse}`
- Trigger phrase: "Hey Google, log blood pressure 120 over 80 pulse 72"

**Fallback: `actions.intent.CREATE_THING`**
- Catches generic voice commands without numbers
- Captures full spoken phrase as `query` param
- URL template: `medtracker://log?query={query}`
- Trigger phrase: "Hey Google, log blood pressure in MedTracker"
- App parses `query` string with regex utility

The existing static shortcut (`shortcutId="log_bp"`) remains unchanged — handles launcher long-press and is bound to both capabilities.

---

## Components

### 1. `android/app/src/main/res/xml/shortcuts.xml`

Replace the current partial `CREATE_THING` implementation with:

```xml
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">

  <!-- Primary: health-specific BII with numeric parameter extraction -->
  <capability android:name="actions.intent.RECORD_HEALTH_OBSERVATION">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.medtracker"
      android:targetClass="com.medtracker.MainActivity">
      <url-template
        android:value="medtracker://log?sys={sys}&amp;dia={dia}&amp;pulse={pulse}" />
      <parameter
        android:name="healthObservation.highValue"
        android:key="sys" />
      <parameter
        android:name="healthObservation.lowValue"
        android:key="dia" />
      <parameter
        android:name="healthObservation.value"
        android:key="pulse" />
    </intent>
  </capability>

  <!-- Fallback: generic creation BII for commands without explicit numbers -->
  <capability android:name="actions.intent.CREATE_THING">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.medtracker"
      android:targetClass="com.medtracker.MainActivity">
      <url-template android:value="medtracker://log?query={query}" />
      <parameter
        android:name="thing.name"
        android:key="query" />
    </intent>
  </capability>

  <!-- Static launcher shortcut — bound to both capabilities -->
  <shortcut
    android:shortcutId="log_bp"
    android:enabled="true"
    android:icon="@mipmap/ic_launcher"
    android:shortcutShortLabel="@string/log_bp_short"
    android:shortcutLongLabel="@string/log_bp_long"
    android:shortcutDisabledMessage="@string/log_bp_disabled">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.medtracker"
      android:targetClass="com.medtracker.MainActivity"
      android:data="medtracker://log" />
    <categories android:name="android.shortcut.conversation" />
    <capability-binding android:key="actions.intent.RECORD_HEALTH_OBSERVATION" />
    <capability-binding android:key="actions.intent.CREATE_THING" />
  </shortcut>

</shortcuts>
```

### 2. `android/app/src/main/AndroidManifest.xml`

Add explicit `intent-filter` inside `<activity android:name=".MainActivity">` for the `medtracker://` scheme:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="medtracker" />
</intent-filter>
```

### 3. `android/app/src/main/res/values/strings.xml`

Add two strings:

```xml
<string name="log_bp_voice_hint">Try: Hey Google, log blood pressure 120 over 80</string>
<string name="log_bp_fallback_label">Log Blood Pressure</string>
```

### 4. `src/shared/lib/voice-query-parser.ts` (new)

Pure utility — no side effects, no upper-layer imports. Single exported function:

```typescript
parseVoiceQuery(query: string): { sys?: number; dia?: number; pulse?: number }
```

Regex patterns handled:
- `"120 over 80"` → `{ sys: 120, dia: 80 }`
- `"120/80"` → `{ sys: 120, dia: 80 }`
- `"120 over 80 pulse 72"` → `{ sys: 120, dia: 80, pulse: 72 }`
- `"blood pressure 120 80"` → `{ sys: 120, dia: 80 }`
- Garbage input → `{}`
- Single number → `{}`

Returns partial results for valid fields only. Callers must treat all fields as optional.

### 5. `src/shared/lib/voice-query-parser.test.ts` (new)

Unit tests covering all patterns above plus edge cases.

### 6. `src/app/navigation/index.tsx`

Add `query?: string` to `VoiceConfirmation` in `RootStackParamList`:

```typescript
VoiceConfirmation: { sys?: string; dia?: string; pulse?: string; query?: string };
```

### 7. `src/pages/voice-logging/ui/VoiceConfirmationPage.tsx`

Two additions:

**a) `query` param parsing on mount**

```typescript
useEffect(() => {
  if (query && !sys && !dia) {
    const parsed = parseVoiceQuery(query);
    // merge parsed values into local state
  }
}, []); // run once on mount only
```

**b) Inline Numpad for missing required fields**

If `sys` or `dia` is absent after param resolution (Google extracted only one value, or `query` parsing failed), show the Numpad inline for the missing field instead of an empty display value. User completes the reading without navigating away.

Pulse remains optional — no inline numpad required for it.

**No other changes** — `validateBPValues`, crisis modal, `recordBP` mutation, and `voiceLoggingEnabled` feature flag are untouched.

---

## Data Flow

```
User speaks → Google Assistant
    → RECORD_HEALTH_OBSERVATION (numbers extracted)
        → medtracker://log?sys=120&dia=80&pulse=72
        → VoiceConfirmationPage (all fields pre-filled)
    → CREATE_THING fallback (no numbers)
        → medtracker://log?query=log+blood+pressure+in+medtracker
        → VoiceConfirmationPage → parseVoiceQuery() → partial or empty fields
        → inline Numpad for missing required fields
    → Static shortcut (launcher)
        → medtracker://log (no params)
        → VoiceConfirmationPage → inline Numpad for all fields
```

---

## Error Handling

- **Google extracts only one value** (e.g. only systolic): inline Numpad appears for the missing required field.
- **`parseVoiceQuery` returns `{}`** (garbage fallback input): both fields show inline Numpad — same as tapping the static shortcut.
- **`voiceLoggingEnabled = false`**: existing warning screen shown — no change to this path.
- **Values fail `validateBPValues`**: existing error display — no change.
- **Crisis threshold crossed**: existing `CrisisModal` — no change.

---

## Testing

| Test | Type | File |
|---|---|---|
| `parseVoiceQuery` pattern coverage | Unit | `voice-query-parser.test.ts` |
| Deep link `medtracker://log?sys=120&dia=80` routes to VoiceConfirmation | Manual | Android emulator |
| Deep link with `query=` param parses and pre-fills | Manual | Android emulator |
| Missing field shows inline Numpad | Manual | Android emulator |
| Static launcher shortcut opens app | Manual | Android emulator |
| App Actions Test Tool (Google) | Manual | Android Studio plugin |

---

## Change Surface

| File | Type | Change |
|---|---|---|
| `android/app/src/main/res/xml/shortcuts.xml` | Modify | Replace with dual-capability implementation |
| `android/app/src/main/AndroidManifest.xml` | Modify | Add `medtracker://` intent-filter |
| `android/app/src/main/res/values/strings.xml` | Modify | Add 2 voice hint strings |
| `src/shared/lib/voice-query-parser.ts` | New | Voice query parsing utility |
| `src/shared/lib/voice-query-parser.test.ts` | New | Unit tests |
| `src/app/navigation/index.tsx` | Modify | Add `query?` to VoiceConfirmation params |
| `src/pages/voice-logging/ui/VoiceConfirmationPage.tsx` | Modify | Handle `query` param + inline Numpad for missing fields |

---

## Out of Scope

- Google Actions Console registration (required for Play Store submission, not for development)
- Android voice trigger testing without Play Store (use App Actions Test Tool in Android Studio)
- iOS changes (Siri Shortcuts already complete)
- Custom BII definitions (uses Google's standard BII catalog only)
