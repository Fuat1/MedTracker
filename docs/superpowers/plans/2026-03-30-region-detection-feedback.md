# Region Detection Feedback Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After tapping "Detect My Region", show an inline banner below the button displaying the detected country, the applied guideline, and a disclaimer to double-check with your doctor.

**Architecture:** Add `detectionResult` state to `ClassificationPage`. Populate it in `handleDetectRegion`. Render a small info banner below the detect button using existing theme colors. Add 3 new i18n keys to the English `pages.json` only.

**Tech Stack:** React Native, TypeScript, react-native-localize, react-i18next, NativeWind/useTheme, Ionicons

---

### Task 1: Add i18n keys

**Files:**
- Modify: `src/shared/config/locales/en/pages.json`

- [ ] **Step 1: Add three keys under `settings.detectRegion`**

Open `src/shared/config/locales/en/pages.json`. Find the `"detectRegion"` block (currently lines ~369–373) and add three keys:

```json
"detectRegion": {
  "button": "Detect My Region",
  "updated": "Settings updated for your region",
  "noChange": "Your settings already match your region",
  "detected": "{{country}} · {{guideline}}",
  "unknownRegion": "Region not detected · Defaulted to AHA/ACC",
  "disclaimer": "Please double-check with your doctor"
},
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/config/locales/en/pages.json
git commit -m "feat(i18n): add region detection feedback keys"
```

---

### Task 2: Update ClassificationPage with detection banner

**Files:**
- Modify: `src/pages/settings/ui/ClassificationPage.tsx`

- [ ] **Step 1: Add `detectionResult` state and update `handleDetectRegion`**

At the top of the `ClassificationPage` function, after the existing `useSettingsStore` destructuring, add:

```typescript
const [detectionResult, setDetectionResult] = React.useState<{
  countryCode: string;
  guideline: string;
} | null>(null);
```

Replace the existing `handleDetectRegion` function (lines 56–79) with:

```typescript
const handleDetectRegion = () => {
  const locales = getLocales();
  const countryCode = locales[0]?.countryCode ?? '';
  const recommended = getSettingsForRegion(countryCode);

  const changed = recommended.guideline !== guideline || recommended.unit !== unit;
  if (changed) {
    if (recommended.guideline !== guideline) setGuideline(recommended.guideline);
    if (recommended.unit !== unit) setUnit(recommended.unit);
    Toast.show({
      type: 'success',
      text1: t('settings.detectRegion.updated'),
      position: 'bottom',
      visibilityTime: 2500,
    });
  } else {
    Toast.show({
      type: 'info',
      text1: t('settings.detectRegion.noChange'),
      position: 'bottom',
      visibilityTime: 2500,
    });
  }

  setDetectionResult({ countryCode, guideline: recommended.guideline });
};
```

- [ ] **Step 2: Add country name helper**

After the `guidelineName` line (currently line 87), add:

```typescript
const detectedCountryName = React.useMemo(() => {
  if (!detectionResult?.countryCode) return null;
  try {
    const displayNames = new Intl.DisplayNames([i18n.language, 'en'], { type: 'region' });
    return displayNames.of(detectionResult.countryCode) ?? detectionResult.countryCode;
  } catch {
    return detectionResult.countryCode;
  }
}, [detectionResult?.countryCode, i18n.language]);
```

Also add `i18n` to the destructuring at the top of the component — replace:

```typescript
const { t } = useTranslation('pages');
```

with:

```typescript
const { t, i18n } = useTranslation('pages');
```

- [ ] **Step 3: Render the detection banner below the button**

Inside the Guideline Card's `<CardBody>`, after the closing `</Button>` tag for the detect button (currently line 132) and before the `<View style={styles.chipRow}>`, add:

```tsx
{detectionResult !== null && (
  <View style={[styles.detectionBanner, { backgroundColor: colors.surface, borderLeftColor: colors.accent }]}>
    <Icon name="information-circle-outline" size={16} color={colors.accent} style={styles.bannerIcon} />
    <View style={styles.bannerText}>
      <Text style={[styles.bannerCountry, { color: colors.textPrimary, fontSize: typography.sm }]}>
        {detectionResult.countryCode
          ? t('settings.detectRegion.detected', {
              country: detectedCountryName ?? detectionResult.countryCode,
              guideline: guidelineNameMap[detectionResult.guideline] ?? detectionResult.guideline,
            })
          : t('settings.detectRegion.unknownRegion')}
      </Text>
      <Text style={[styles.bannerDisclaimer, { color: colors.textTertiary, fontSize: typography.xs }]}>
        {t('settings.detectRegion.disclaimer')}
      </Text>
    </View>
  </View>
)}
```

- [ ] **Step 4: Add styles**

In the `StyleSheet.create({...})` block, add:

```typescript
detectionBanner: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  borderLeftWidth: 3,
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 8,
  marginBottom: 12,
  gap: 8,
},
bannerIcon: {
  marginTop: 1,
},
bannerText: {
  flex: 1,
  gap: 2,
},
bannerCountry: {
  fontFamily: FONTS.semiBold,
  fontWeight: '600',
},
bannerDisclaimer: {
  fontFamily: FONTS.regular,
  lineHeight: 16,
},
```

- [ ] **Step 5: Run type check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/pages/settings/ui/ClassificationPage.tsx
git commit -m "feat(settings): show region detection feedback banner with disclaimer"
```

---

### Task 3: Update verified-functionalities doc

**Files:**
- Modify: `docs/verified-functionalities.md`

- [ ] **Step 1: Update the region detection section**

Find the section describing "Detect My Region" functionality and update it to note that after detection, an inline banner now shows the detected country, applied guideline, and a disclaimer.

Also update the `> Last verified:` date at the top to `2026-03-30`.

- [ ] **Step 2: Commit**

```bash
git add docs/verified-functionalities.md
git commit -m "docs: update verified-functionalities for region detection banner"
```
