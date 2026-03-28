# Android Voice Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable "Hey Google, log blood pressure 120 over 80 pulse 72" to open MedTracker's VoiceConfirmationPage with values pre-filled, mirroring the existing iOS Siri Shortcuts flow.

**Architecture:** Two Google App Actions BIIs declared in `shortcuts.xml` — `RECORD_HEALTH_OBSERVATION` (primary, numeric extraction) and `CREATE_THING` (fallback, string parsing). A new pure utility `voice-query-parser.ts` handles fallback string parsing. `VoiceConfirmationPage` gains a `query` param and shows inline `<Numpad>` for any missing required field.

**Tech Stack:** Android App Actions XML (`shortcuts.xml`), React Navigation deep link params, React Native `<Numpad>` from `shared/ui`, Jest for unit tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/shared/lib/voice-query-parser.ts` | **Create** | Parse spoken BP phrases into `{ sys, dia, pulse }` |
| `src/shared/lib/voice-query-parser.test.ts` | **Create** | Unit tests for all regex patterns |
| `android/app/src/main/res/values/strings.xml` | **Modify** | Add voice hint strings |
| `android/app/src/main/res/xml/shortcuts.xml` | **Modify** | Replace with dual-BII implementation |
| `android/app/src/main/AndroidManifest.xml` | **Modify** | Add `medtracker://` deep link intent-filter |
| `src/app/navigation/index.tsx` | **Modify** | Add `query?: string` to `VoiceConfirmation` params |
| `src/pages/voice-logging/ui/VoiceConfirmationPage.tsx` | **Modify** | Handle `query` param + inline Numpad for missing fields |

---

## Task 1: Voice Query Parser (TDD)

**Files:**
- Create: `src/shared/lib/voice-query-parser.ts`
- Create: `src/shared/lib/voice-query-parser.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/lib/voice-query-parser.test.ts`:

```typescript
import { parseVoiceQuery } from './voice-query-parser';

describe('parseVoiceQuery', () => {
  describe('RECORD_HEALTH_OBSERVATION fallback patterns', () => {
    it('parses "120 over 80"', () => {
      expect(parseVoiceQuery('120 over 80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "120/80"', () => {
      expect(parseVoiceQuery('120/80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "blood pressure 120 over 80"', () => {
      expect(parseVoiceQuery('blood pressure 120 over 80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "blood pressure 120 80" (space-separated without over)', () => {
      expect(parseVoiceQuery('blood pressure 120 80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "120 over 80 pulse 72"', () => {
      expect(parseVoiceQuery('120 over 80 pulse 72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });

    it('parses "120/80 heart rate 72"', () => {
      expect(parseVoiceQuery('120/80 heart rate 72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });

    it('parses "120/80 hr 72"', () => {
      expect(parseVoiceQuery('120/80 hr 72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });
  });

  describe('edge cases', () => {
    it('returns {} for a single number', () => {
      expect(parseVoiceQuery('120')).toEqual({});
    });

    it('returns {} for garbage input', () => {
      expect(parseVoiceQuery('log blood pressure in medtracker')).toEqual({});
    });

    it('returns {} for empty string', () => {
      expect(parseVoiceQuery('')).toEqual({});
    });

    it('drops sys if outside valid range (40–300)', () => {
      expect(parseVoiceQuery('30 over 80')).toEqual({ dia: 80 });
    });

    it('drops dia if outside valid range (30–200)', () => {
      expect(parseVoiceQuery('120 over 20')).toEqual({ sys: 120 });
    });

    it('drops pulse if outside valid range (30–250)', () => {
      expect(parseVoiceQuery('120 over 80 pulse 10')).toEqual({ sys: 120, dia: 80 });
    });

    it('handles URL-encoded spaces (+ characters from deep link)', () => {
      expect(parseVoiceQuery('120+over+80+pulse+72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd "c:\Users\fuats\Desktop\Workdir\MedTracker"
npx jest voice-query-parser --no-coverage 2>&1 | tail -20
```

Expected: `Cannot find module './voice-query-parser'`

- [ ] **Step 3: Implement the parser**

Create `src/shared/lib/voice-query-parser.ts`:

```typescript
export function parseVoiceQuery(
  query: string,
): { sys?: number; dia?: number; pulse?: number } {
  if (!query || typeof query !== 'string') {
    return {};
  }

  // Decode URL-encoded spaces (+ from query strings)
  const normalized = query.replace(/\+/g, ' ').trim();

  const result: { sys?: number; dia?: number; pulse?: number } = {};

  // Match "120 over 80", "120/80", or "blood pressure 120 80"
  const bpMatch =
    normalized.match(/(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})/i) ??
    normalized.match(/blood\s+pressure\s+(\d{2,3})\s+(\d{2,3})/i);

  if (bpMatch) {
    const sys = parseInt(bpMatch[1], 10);
    const dia = parseInt(bpMatch[2], 10);
    if (sys >= 40 && sys <= 300) {
      result.sys = sys;
    }
    if (dia >= 30 && dia <= 200) {
      result.dia = dia;
    }
  }

  // Match "pulse 72", "heart rate 72", "hr 72"
  const pulseMatch = normalized.match(
    /(?:pulse|heart\s+rate|hr)\s*:?\s*(\d{2,3})/i,
  );
  if (pulseMatch) {
    const pulse = parseInt(pulseMatch[1], 10);
    if (pulse >= 30 && pulse <= 250) {
      result.pulse = pulse;
    }
  }

  return result;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest voice-query-parser --no-coverage 2>&1 | tail -20
```

Expected: `Tests: 12 passed, 12 total`

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/voice-query-parser.ts src/shared/lib/voice-query-parser.test.ts
git commit -m "feat: add voice query parser for Android CREATE_THING fallback"
```

---

## Task 2: Android Configuration Files

**Files:**
- Modify: `android/app/src/main/res/values/strings.xml`
- Modify: `android/app/src/main/res/xml/shortcuts.xml`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add voice hint strings**

Replace the entire content of `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">MedTracker</string>
    <string name="log_bp_short">Log BP</string>
    <string name="log_bp_long">Log Blood Pressure</string>
    <string name="log_bp_disabled">Voice Logging disabled</string>
    <string name="log_bp_voice_hint">Try: Hey Google, log blood pressure 120 over 80</string>
    <string name="log_bp_fallback_label">Log Blood Pressure</string>
</resources>
```

- [ ] **Step 2: Replace shortcuts.xml with dual-BII implementation**

Replace the entire content of `android/app/src/main/res/xml/shortcuts.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Primary: health-specific BII — Google Assistant extracts numbers natively -->
    <!-- Trigger: "Hey Google, log blood pressure 120 over 80 pulse 72" -->
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

    <!-- Fallback: generic creation BII — captures full phrase for in-app parsing -->
    <!-- Trigger: "Hey Google, log blood pressure in MedTracker" (no numbers) -->
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

    <!-- Static launcher shortcut — long-press app icon, bound to both capabilities -->
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

- [ ] **Step 3: Add deep link intent-filter to AndroidManifest.xml**

In `android/app/src/main/AndroidManifest.xml`, add the following intent-filter block inside `<activity android:name=".MainActivity">`, after the existing Health permissions intent-filter (line 37) and before the `<meta-data>` tag (line 41):

```xml
      <!-- Deep link handler for medtracker:// scheme (App Actions + direct links) -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="medtracker" />
      </intent-filter>
```

The activity block should look like this after the edit:

```xml
    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:exported="true"
      android:theme="@style/BootTheme">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>

      <intent-filter>
        <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
      </intent-filter>

      <!-- Deep link handler for medtracker:// scheme (App Actions + direct links) -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="medtracker" />
      </intent-filter>

      <!-- App Actions Shortcuts -->
      <meta-data
        android:name="android.app.shortcuts"
        android:resource="@xml/shortcuts" />
    </activity>
```

- [ ] **Step 4: Commit Android config changes**

```bash
git add android/app/src/main/res/values/strings.xml \
        android/app/src/main/res/xml/shortcuts.xml \
        android/app/src/main/AndroidManifest.xml
git commit -m "feat: configure Android App Actions with dual-BII and deep link intent-filter"
```

---

## Task 3: Navigation Type Update

**Files:**
- Modify: `src/app/navigation/index.tsx` (line 45)

- [ ] **Step 1: Add `query` param to VoiceConfirmation route type**

In `src/app/navigation/index.tsx`, replace line 45:

```typescript
  VoiceConfirmation: { sys?: string; dia?: string; pulse?: string };
```

with:

```typescript
  VoiceConfirmation: { sys?: string; dia?: string; pulse?: string; query?: string };
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "error" | head -20
```

Expected: no new errors related to `VoiceConfirmation`.

- [ ] **Step 3: Commit**

```bash
git add src/app/navigation/index.tsx
git commit -m "feat: add query param to VoiceConfirmation route type"
```

---

## Task 4: Update VoiceConfirmationPage

**Files:**
- Modify: `src/pages/voice-logging/ui/VoiceConfirmationPage.tsx`

- [ ] **Step 1: Write the updated page**

Replace the entire content of `src/pages/voice-logging/ui/VoiceConfirmationPage.tsx`:

```tsx
import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../app/navigation';
import { validateBPValues } from '../../../entities/blood-pressure';
import { useRecordBP } from '../../../features/record-bp';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useToast } from '../../../shared/lib/use-toast';
import { parseVoiceQuery } from '../../../shared/lib/voice-query-parser';
import { Button, ButtonText, ButtonSpinner, Card, Toast, Numpad } from '../../../shared/ui';

type VoiceConfirmationRouteProp = RouteProp<RootStackParamList, 'VoiceConfirmation'>;

export function VoiceConfirmationPage() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<VoiceConfirmationRouteProp>();
  const { toastMsg, toastType, toastVisible, showToast, hideToast } = useToast();
  const { mutateAsync: recordBP, isPending } = useRecordBP();
  const { voiceLoggingEnabled } = useSettingsStore();

  // Resolve initial values: explicit params take priority, then query parsing
  const parsed = route.params?.query ? parseVoiceQuery(route.params.query) : {};

  const [sysStr, setSysStr] = useState(
    route.params?.sys ?? (parsed.sys !== undefined ? String(parsed.sys) : ''),
  );
  const [diaStr, setDiaStr] = useState(
    route.params?.dia ?? (parsed.dia !== undefined ? String(parsed.dia) : ''),
  );
  const [pulseStr, setPulseStr] = useState(
    route.params?.pulse ?? (parsed.pulse !== undefined ? String(parsed.pulse) : ''),
  );

  const systolic = parseInt(sysStr, 10);
  const diastolic = parseInt(diaStr, 10);
  const pulse = pulseStr ? parseInt(pulseStr, 10) : undefined;

  const sysMissing = sysStr === '';
  const diaMissing = diaStr === '';

  const handleSave = async () => {
    if (!voiceLoggingEnabled) {
      showToast('Voice logging is disabled in Settings.', 'warning');
      return;
    }

    if (isNaN(systolic) || isNaN(diastolic)) {
      showToast('Invalid blood pressure values', 'error');
      return;
    }

    const validation = validateBPValues(systolic, diastolic, pulse);
    if (!validation.isValid) {
      showToast(validation.errors.join(', '), 'error');
      return;
    }

    try {
      await recordBP({
        systolic,
        diastolic,
        pulse,
      });
      navigation.goBack();
    } catch {
      showToast('Failed to save reading', 'error');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-surface-base">
      <Toast
        message={toastMsg}
        type={toastType}
        visible={toastVisible}
        onHide={hideToast}
      />
      {!voiceLoggingEnabled ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-xl font-bold mb-4 text-center text-text-primary">
            Voice Logging Disabled
          </Text>
          <Text className="text-base text-center text-text-secondary mb-8">
            Please enable Voice Logging in the app settings to log blood pressure via voice assistants.
          </Text>
          <Button
            variant="primary"
            size="lg"
            onPress={() => navigation.goBack()}
          >
            <ButtonText>Go Back</ButtonText>
          </Button>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-6">
          <Text className="text-2xl font-bold mb-2 text-center text-text-primary">
            Confirm Voice Entry
          </Text>
          <Text className="text-base mb-6 text-center text-text-secondary">
            {sysMissing || diaMissing
              ? 'Complete the missing values below'
              : 'Does this look correct?'}
          </Text>

          <Card style={{ padding: 24, marginBottom: 16, alignItems: 'center' }}>
            <Text className="text-4xl font-bold text-text-primary mb-2">
              {sysStr || '--'} / {diaStr || '--'}
            </Text>
            <Text className="text-sm text-text-secondary">
              {t('common.bloodPressure')} (mmHg)
            </Text>

            {pulse !== undefined && !isNaN(pulse) ? (
              <View className="mt-4 items-center">
                <Text className="text-2xl font-bold text-text-primary mb-1">
                  {pulse}
                </Text>
                <Text className="text-sm text-text-secondary">
                  {t('common.pulse')} (BPM)
                </Text>
              </View>
            ) : null}
          </Card>

          {sysMissing && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-text-primary text-center mb-2">
                Systolic (mmHg)
              </Text>
              <Numpad
                value={sysStr}
                onValueChange={setSysStr}
                maxLength={3}
                compact
              />
            </View>
          )}

          {diaMissing && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-text-primary text-center mb-2">
                Diastolic (mmHg)
              </Text>
              <Numpad
                value={diaStr}
                onValueChange={setDiaStr}
                maxLength={3}
                compact
              />
            </View>
          )}

          <View className="gap-y-4 mt-2">
            <Button
              variant="primary"
              size="lg"
              onPress={handleSave}
              isDisabled={isPending || sysMissing || diaMissing}
            >
              <ButtonText>{t('buttons.save')}</ButtonText>
              {isPending ? <ButtonSpinner /> : null}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onPress={() => navigation.goBack()}
              isDisabled={isPending}
            >
              <ButtonText>{t('buttons.cancel')}</ButtonText>
            </Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
npx jest --no-coverage 2>&1 | tail -15
```

Expected: all existing tests pass, `voice-query-parser` tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/voice-logging/ui/VoiceConfirmationPage.tsx
git commit -m "feat: handle query param and inline numpad for missing BP fields in VoiceConfirmationPage"
```

---

## Task 5: Verify End-to-End on Android Emulator

- [ ] **Step 1: Build and launch on Android emulator**

```bash
npx react-native run-android
```

Expected: app launches without crash.

- [ ] **Step 2: Test deep link with all params (primary BII simulation)**

In a new terminal:

```bash
adb shell am start -W -a android.intent.action.VIEW -d "medtracker://log?sys=120&dia=80&pulse=72" com.medtracker
```

Expected: VoiceConfirmationPage opens with `120 / 80` and pulse `72` displayed, no inline Numpad visible, Save button enabled.

- [ ] **Step 3: Test deep link with query param (fallback BII simulation)**

```bash
adb shell am start -W -a android.intent.action.VIEW -d "medtracker://log?query=120+over+80+pulse+72" com.medtracker
```

Expected: VoiceConfirmationPage opens with `120 / 80` and pulse `72` displayed (parsed from query string), no inline Numpad visible.

- [ ] **Step 4: Test deep link with missing diastolic**

```bash
adb shell am start -W -a android.intent.action.VIEW -d "medtracker://log?sys=120" com.medtracker
```

Expected: VoiceConfirmationPage opens with `120 / --`, Diastolic Numpad shown inline, Save button disabled until diastolic is entered.

- [ ] **Step 5: Test bare deep link (static shortcut simulation)**

```bash
adb shell am start -W -a android.intent.action.VIEW -d "medtracker://log" com.medtracker
```

Expected: VoiceConfirmationPage opens with `-- / --`, both Numpads shown inline.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: address emulator testing issues with voice confirmation"
```

---

## Testing with App Actions Test Tool (Android Studio)

After Tasks 1–5 are complete, validate App Actions in Android Studio:

1. Open project in Android Studio
2. **Tools → App Actions Test Tool**
3. Select `actions.intent.RECORD_HEALTH_OBSERVATION`
4. Set parameters: `healthObservation.highValue=120`, `healthObservation.lowValue=80`, `healthObservation.value=72`
5. Click **Run** — VoiceConfirmationPage should open with values pre-filled
6. Repeat with `actions.intent.CREATE_THING`, set `thing.name=120 over 80 pulse 72`
7. VoiceConfirmationPage should parse and pre-fill values

> **Note:** "Hey Google" voice activation requires the app to be published on Google Play Store. Use the App Actions Test Tool for all development testing.
