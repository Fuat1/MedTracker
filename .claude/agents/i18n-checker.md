# i18n Completeness Agent

**Type**: Background Agent (runs on-demand or before commits)
**Purpose**: Verify translation completeness across all 4 supported languages

## Agent Behavior

This agent ensures all translation keys exist in all language files and flags missing or inconsistent translations.

### Supported Languages

MedTracker supports 4 languages:
- **en** (English) - Source of truth
- **tr** (Turkish) - Türkçe
- **id** (Indonesian) - Bahasa Indonesia
- **sr** (Serbian) - Српски

### Translation Namespace Structure

```
src/shared/config/locales/
├── en/
│   ├── common.json       # Shared UI (buttons, units, time, navigation)
│   ├── validation.json   # Error messages and validation feedback
│   ├── medical.json      # BP categories, guidelines, medical terms
│   ├── pages.json        # Page-specific content
│   └── widgets.json      # Widget-specific content
├── id/ (same structure)
├── sr/ (same structure)
└── tr/ (same structure)
```

## Validation Steps

### Step 1: Load All Language Files

Read all JSON files for each language:
```typescript
const languages = ['en', 'tr', 'id', 'sr'];
const namespaces = ['common', 'validation', 'medical', 'pages', 'widgets'];

for (const lang of languages) {
  for (const ns of namespaces) {
    const content = await readJSON(`src/shared/config/locales/${lang}/${ns}.json`);
    // ... validate
  }
}
```

### Step 2: Extract All Keys from English (Source)

Flatten nested JSON structure to dot-notation keys:
```typescript
// Input: { "buttons": { "save": "Save", "cancel": "Cancel" } }
// Output: ["buttons.save", "buttons.cancel"]

function flattenKeys(obj: object, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}
```

### Step 3: Compare Keys Across Languages

For each language (tr, id, sr), check:
1. **Missing keys**: Keys in `en` but NOT in target language
2. **Extra keys**: Keys in target language but NOT in `en` (orphaned translations)
3. **Empty values**: Keys exist but value is empty string `""`

### Step 4: Validate Interpolation Variables

Check that interpolation variables match between English and translations:

**Example**:
```json
// en/validation.json
"systolicRange": "Systolic must be between {{min}} and {{max}}"

// tr/validation.json
"systolicRange": "Sistolik {{min}} ile {{max}} arasında olmalıdır" ✅

// id/validation.json (WRONG - missing {{max}})
"systolicRange": "Sistolik harus antara {{min}} saja" ❌
```

**Validation logic**:
```typescript
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return matches.map(m => m.replace(/[{}]/g, ''));
}

// Compare:
const enVars = extractVariables(enValue);
const targetVars = extractVariables(targetValue);
if (JSON.stringify(enVars.sort()) !== JSON.stringify(targetVars.sort())) {
  // Flag as interpolation mismatch
}
```

### Step 5: Medical Term Validation

**Critical Rule**: Medical abbreviations MUST NOT be translated.

**Invariant terms** (should be identical across all languages):
- `mmHg` (millimeters of mercury)
- `BPM` (beats per minute)
- `AHA/ACC`, `WHO`, `ESC/ESH`, `JSH` (guideline names)

**Check**:
```typescript
const medicalAbbreviations = ['mmHg', 'BPM', 'AHA/ACC', 'WHO', 'ESC/ESH', 'JSH'];

for (const abbr of medicalAbbreviations) {
  const enOccurrences = countOccurrences(enContent, abbr);
  const targetOccurrences = countOccurrences(targetContent, abbr);

  if (enOccurrences !== targetOccurrences) {
    // Flag: Medical abbreviation incorrectly translated
  }
}
```

### Step 6: Pluralization Rules

i18next uses suffix-based pluralization:
- `_zero` (0 items)
- `_one` (1 item)
- `_two` (2 items, some languages)
- `_few` (3-4 items, some languages)
- `_many` (5+ items, some languages)
- `_other` (default plural)

**English example**:
```json
{
  "recordCount_one": "{{count}} reading",
  "recordCount_other": "{{count}} readings"
}
```

**Serbian example** (complex plural rules):
```json
{
  "recordCount_one": "{{count}} merenje",      // 1, 21, 31, ...
  "recordCount_few": "{{count}} merenja",      // 2-4, 22-24, ...
  "recordCount_other": "{{count}} merenja"     // 5+, 0
}
```

**Validation**: Check that plural keys exist for languages with complex rules.

### Step 7: Scan Code for Hardcoded Strings

Detect potential missing translations:
```bash
grep -r "Text>" src/ | grep -v "t(" | grep -v "i18n" | grep -v ".test."
```

**Violations to flag**:
```typescript
// ❌ BAD: Hardcoded string
<Text>Save Reading</Text>

// ✅ GOOD: i18n key
<Text>{t('pages:newReading.saveReading')}</Text>
```

## Output Report

```markdown
# i18n Completeness Report

## Summary
- Total namespaces: 5
- Total keys (English): 247
- Languages: 4 (en, tr, id, sr)

## ✅ COMPLETE
- **Turkish (tr)**: 247/247 keys (100%)
- **Indonesian (id)**: 247/247 keys (100%)

## ❌ INCOMPLETE

### Serbian (sr)
**Missing keys (3)**:
- `pages.preMeasurement.title`
- `pages.preMeasurement.breathing.inhale`
- `pages.preMeasurement.breathing.exhale`

**Extra keys (1)**:
- `pages.oldFeature.removed` (orphaned, remove from sr/pages.json)

**Interpolation mismatches (1)**:
- `validation.systolicRange`: Missing `{{max}}` variable

## ⚠️ WARNINGS

### Medical Term Translation Detected
**File**: id/medical.json
**Key**: `units.mmHg`
**Value**: `"mmHg"` ✅ (correct, invariant)

**File**: tr/medical.json
**Key**: `categories.crisis`
**Issue**: "Hipertansif Kriz" — Verify urgency is conveyed (English: "Hypertensive Crisis")

## 🔍 HARDCODED STRINGS DETECTED

**File**: src/pages/settings/ui/SettingsPage.tsx
**Line**: 142
**Code**: `<Text>About MedTracker</Text>`
**Fix**: Add `pages.settings.about` to pages.json, use `t('pages:settings.about')`

## Recommendations

1. **Add missing Serbian translations** (3 keys)
2. **Remove orphaned key** `pages.oldFeature.removed` from sr/pages.json
3. **Fix interpolation** in id/validation.json `systolicRange`
4. **Extract hardcoded string** in SettingsPage.tsx line 142
5. **Review medical term** tr/medical.json `categories.crisis` for urgency
```

## Integration with Hooks

Suggested PreToolUse hook to block commits with incomplete translations:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash.*git commit",
        "hooks": [
          {
            "type": "agent",
            "agent": "i18n-checker",
            "timeout": 20,
            "block_on_failure": true
          }
        ]
      }
    ]
  }
}
```

## Language-Specific Validation Rules

### Turkish (tr)
- Proper noun case: "Türkçe" not "türkçe"
- Suffixes: Check vowel harmony (e.g., `-dır/-dir/-dur/-dür`)

### Indonesian (id)
- Formal vs informal: Use formal register ("Anda" not "kamu")
- Medical terms: Verify `"tekanan darah"` (blood pressure) consistency

### Serbian (sr)
- Cyrillic script: Ensure Cyrillic (Српски) not Latin (Srpski)
- Complex plurals: Validate `_one`, `_few`, `_other` suffixes

## False Positive Handling

**Exemptions**:
- Date format strings (e.g., `"YYYY-MM-DD"`) are locale-specific, may differ
- Regex patterns (e.g., `"\\d+"`) should be identical
- Color hex codes (e.g., `"#0D9488"`) are universal

## Performance Considerations

- **Cache English keys**: Flatten once, compare against all languages
- **Incremental mode**: If only one language file changed, only validate that file
- **Parallel validation**: Check each language concurrently

## Exit Behavior

- If **missing keys** found: Block commit, provide list of keys to add
- If **warnings only**: Allow commit, log warnings for review
- If **all complete**: Silent success

## References

- i18next pluralization: https://www.i18next.com/translation-function/plurals
- Medical translation guidelines: `CLAUDE.md` Section 7 (i18n Rules)
- Project i18n structure: `src/shared/lib/i18n.ts`
