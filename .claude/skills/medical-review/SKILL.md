# Medical Review Skill

**Invocation**: `/medical-review` or when user asks to "review medical safety" or "audit BP classification logic"

**Purpose**: Comprehensive safety audit of blood pressure classification and medical data handling

## Skill Behavior

When invoked, this skill performs a systematic safety review:

### 1. Classification Logic Audit
- ✅ Read `src/entities/blood-pressure/lib.ts` (or equivalent classification file)
- ✅ Verify thresholds match `docs/bp-classification-guidelines.md` for selected guideline (AHA/ACC, WHO, ESC/ESH, JSH)
- ✅ Check for hardcoded magic numbers (MUST use typed constants from `src/shared/config/bp-guidelines.ts`)
- ✅ Verify crisis threshold logic (≥180/120 for AHA/ACC, ≥180/110 for others)
- ✅ Confirm category precedence: crisis > stage_2 > stage_1 > elevated > normal

### 2. Input Validation Audit
- ✅ Read validation functions (`validateBPValues`, etc.)
- ✅ Verify systolic range: 40-300 mmHg
- ✅ Verify diastolic range: 30-200 mmHg
- ✅ Verify pulse range (if present): 30-250 BPM
- ✅ Confirm systolic > diastolic logic check
- ✅ Check database constraints match TypeScript validation

### 3. Database Schema Check
- ✅ Read `src/shared/api/db.ts` (or schema file)
- ✅ Verify SQL CHECK constraints match validation rules
- ✅ Confirm parameterized queries (no string concatenation)
- ✅ Check for SQLCipher encryption setup

### 4. UI Disclaimer Audit
- ✅ Grep for crisis warning UI (`CrisisModal`, alert modals)
- ✅ Verify disclaimer text matches `docs/medical-disclaimers.md`
- ✅ Check PDF export includes required disclaimers
- ✅ Confirm "Not medical advice" footer on analytics/reports

### 5. i18n Medical Terms
- ✅ Read `src/shared/config/locales/en/medical.json`
- ✅ Verify category translations are accurate
- ✅ Check crisis warning translations convey urgency
- ✅ Confirm medical abbreviations (mmHg, BPM) are NOT translated

## Output Format

```markdown
# Medical Safety Audit Report

## ✅ PASSED
- [List of checks that passed]

## ⚠️ WARNINGS
- [List of non-critical issues found]

## ❌ CRITICAL FAILURES
- [List of safety violations requiring immediate fix]

## Recommendations
- [Specific actionable fixes]
```

## Exit Behavior

- If CRITICAL FAILURES found: Block further development until fixed
- If only WARNINGS: Allow work to continue but highlight in summary
- If all PASSED: Give green light with summary

## Integration with Hooks

This skill should be triggered:
- Before committing classification logic changes
- After modifying `bp-guidelines.ts` or `lib.ts` in entities/blood-pressure
- When user asks to "verify medical accuracy"

## Medical Accuracy Sources

Cross-reference against:
- `docs/bp-classification-guidelines.md` (AHA/ACC 2025, WHO 2021, ESC/ESH 2024, JSH)
- `docs/medical-disclaimers.md` (required legal language)
- `.claude/rules/safety-rules.md` (universal safety constraints)
