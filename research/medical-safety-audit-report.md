# MedTracker Medical Safety Audit Report
**Date:** February 15, 2026
**Auditor:** Claude Code
**Scope:** Blood Pressure Classification & Validation Logic
**References:** research/Claude-research.md, research/Google.md

---

## Executive Summary

This audit identified **14 discrepancies** between MedTracker's BP classification implementation and official medical guidelines (AHA/ACC 2025, ESC/ESH 2024, JSH 2025, WHO/ISH 1999). **Four issues are critical patient-safety risks** that could mislead users about dangerous medical conditions.

**Status:** 🔴 **UNSAFE FOR PRODUCTION** until critical issues resolved.

---

## Critical Issues (🔴 Patient Safety Risk)

### 1. Pulse Pressure Interpretation Inverted

**Severity:** 🔴 **CRITICAL**
**Impact:** Could falsely reassure heart failure patients
**File:** `src/entities/blood-pressure/lib.ts:220-223`

**Current Code:**
```typescript
export function interpretPulsePressure(pp: number): 'normal' | 'borderline' | 'high' {
  if (pp < 40) return 'normal';  // ❌ WRONG
  if (pp <= 60) return 'borderline';
  return 'high';
}
```

**Problem:** Pulse pressure <40 mmHg indicates **narrow/low PP**, a pathological sign of:
- Decreased cardiac output
- Heart failure
- Significant blood loss
- Aortic stenosis
- Cardiac tamponade

**Medical Standard:** Normal PP ≈ 40 mmHg (StatPearls, Cleveland Clinic)

**Correct Implementation:**
```typescript
export function interpretPulsePressure(pp: number): 'low' | 'normal' | 'high' {
  if (pp < 40) return 'low';      // ✅ NARROW PP (pathological)
  if (pp <= 60) return 'normal';  // ✅ Normal range
  return 'high';                  // ✅ WIDE PP (arterial stiffness)
}
```

**Also affects:**
- `src/shared/config/locales/en/medical.json:46` — Translation says "Normal: <40 mmHg"
- All other language files (tr, id, sr)

---

### 2. ESC/ESH Classification Gap (Unclassified Readings)

**Severity:** 🔴 **CRITICAL**
**Impact:** Blood pressure readings fall into no category
**File:** `src/entities/blood-pressure/lib.ts:50-61`

**Current Code:**
```typescript
if (guideline === BP_GUIDELINES.ESC_ESH) {
  if (systolic >= 180 || diastolic >= 110) return BP_CATEGORIES.CRISIS;
  if (systolic >= 160 || diastolic >= 100) return BP_CATEGORIES.STAGE_2;
  if (systolic >= 140 || diastolic >= 90) return BP_CATEGORIES.STAGE_1;
  if (systolic >= 130 && diastolic < 85) {  // ❌ AND logic creates gap
    return BP_CATEGORIES.ELEVATED;
  }
  if (systolic < 130 && diastolic < 85) return BP_CATEGORIES.NORMAL;
  return BP_CATEGORIES.NORMAL; // fallback
}
```

**Problem:** A reading of **125/87 mmHg falls into NO category**:
- Normal requires: `systolic < 130 AND diastolic < 85` ❌ Fails (DBP 87)
- Elevated requires: `systolic >= 130 AND diastolic < 85` ❌ Fails (SBP 125)
- Stage 1 requires: `systolic >= 140 OR diastolic >= 90` ❌ Fails (both)

**ESC/ESH 2018 Standard:** High Normal = `SBP 130-139 AND/OR DBP 85-89`

**Correct Implementation:**
```typescript
if (systolic >= 130 || (diastolic >= 85 && diastolic < 90)) {  // ✅ OR logic
  return BP_CATEGORIES.ELEVATED;
}
```

**Alternative (ESC 2024):** Implement the new 3-category system:
- Non-elevated BP: `<120 AND <70`
- Elevated BP: `120-139 OR 70-89`
- Hypertension: `≥140 OR ≥90`

---

### 3. JSH DBP Boundary Error + AND/OR Logic Failure

**Severity:** 🔴 **CRITICAL**
**Impact:** Misclassifies readings with DBP 80-84 as Normal instead of Elevated
**File:** `src/entities/blood-pressure/lib.ts:67-78`

**Current Code:**
```typescript
if (guideline === BP_GUIDELINES.JSH) {
  if (systolic >= 180 || diastolic >= 110) return BP_CATEGORIES.CRISIS;
  if (systolic >= 160 || diastolic >= 100) return BP_CATEGORIES.STAGE_2;
  if (systolic >= 140 || diastolic >= 90) return BP_CATEGORIES.STAGE_1;
  if (systolic >= 130 && diastolic < 85) {  // ❌ WRONG BOUNDARY + AND logic
    return BP_CATEGORIES.ELEVATED;
  }
  if (systolic < 130 && diastolic < 85) return BP_CATEGORIES.NORMAL;
  return BP_CATEGORIES.NORMAL;
}
```

**Problem 1:** JSH uses **DBP 80 mmHg** boundary, not 85 mmHg
**Problem 2:** JSH Elevated BP = `SBP 130-139 AND/OR DBP 80-89` (OR logic, not AND)

**Example:** Reading **125/82 mmHg**:
- Current: Classified as "Normal" ❌
- JSH 2025: Should be "Elevated BP" ✅

**Correct Implementation:**
```typescript
if (systolic >= 130 || (diastolic >= 80 && diastolic < 90)) {  // ✅ DBP 80 + OR logic
  return BP_CATEGORIES.ELEVATED;
}
```

---

### 4. Missing Emergency Symptoms in Crisis Warning

**Severity:** 🔴 **CRITICAL**
**Impact:** Users may miss stroke/aortic dissection warning signs
**File:** `docs/medical-disclaimers.md:31-37`

**Current Symptom List:**
```markdown
• Severe chest pain
• Severe headache
• Shortness of breath
• Vision changes or blurriness
• Difficulty speaking
```

**Missing per AHA Guidelines:**
- ❌ **Back pain** — Critical indicator of aortic dissection (life-threatening)
- ❌ **Numbness** — Sign of stroke or neurological damage
- ❌ **Weakness** — Sign of stroke or neurological damage

**Also Missing (StatPearls):**
- Confusion/altered mental status (hypertensive encephalopathy)
- Seizures
- Nausea/vomiting

**Minimum Required:** Add back pain, numbness, weakness to match AHA published list.

**Affected Files:**
- `docs/medical-disclaimers.md:31-37`
- `src/shared/config/locales/en/medical.json:11` (crisis message)
- All other language files

---

## High-Priority Issues (🟡 Clinically Significant)

### 5. WHO Attribution Error

**Severity:** 🟡 **HIGH**
**Impact:** Misleading guideline source
**File:** `src/entities/blood-pressure/lib.ts:74`

**Current Comment:**
```typescript
// WHO Guidelines (World Health Organization) - 2021
```

**Problem:** WHO 2021 guideline (WHO/UCN/NCD/20.07) **has no BP classification table**. It only addresses treatment thresholds.

**Actual Source:** WHO/ISH 1999 classification

**Evidence:** Nugroho et al., Annals of Medicine, 2022: "This classification is not included in the WHO guidelines, which focus more on pharmacological treatment."

**Fix:**
- Line 74: Change to `// WHO/ISH Guidelines (World Health Organization / International Society of Hypertension) - 1999`
- `src/shared/config/settings.ts:14` — Update comment
- Settings page: Update "WHO" guideline description

---

### 6. ESC 2024 Paradigm Shift Not Implemented

**Severity:** 🟡 **HIGH**
**Impact:** App uses superseded 2018 framework
**File:** `src/entities/blood-pressure/lib.ts:50-61`

**Problem:** ESC 2024 introduced a **radically new 3-category system**:

| Category | Systolic | Logic | Diastolic |
|----------|----------|-------|-----------|
| Non-elevated BP | <120 | AND | <70 |
| Elevated BP | 120-139 | OR | 70-89 |
| Hypertension | ≥140 | OR | ≥90 |

**Key Change:** Diastolic boundary shifted from **85 → 70 mmHg**

**Current Implementation:** Uses ESC/ESH 2018 5-category system (Optimal/Normal/High Normal/Grade 1/2/3)

**Recommendation:** Add `ESC_2024` as separate guideline option to preserve backward compatibility.

---

### 7. Terminology Mismatch (Grade vs Stage)

**Severity:** 🟡 **HIGH**
**Impact:** Inconsistent with official guideline terminology
**Files:** Multiple

**Problem:** App uses "Stage 1/2" and "Hypertensive Crisis" universally, but:
- **ESC/ESH:** Uses "Grade 1/2/3 Hypertension" (not Stage)
- **JSH:** Uses "Grade I/II/III Hypertension" (not Stage)
- **WHO/ISH:** Uses "Grade 1/2/3" (not Stage)
- **AHA/ACC:** Uses "Stage 1/2" ✅ correct

**Crisis Terminology:**
- ESC/ESH: "Grade 3 Hypertension" (≥180/≥110)
- WHO/ISH: "Grade 3 (Severe)" (≥180/≥110)
- JSH: "Grade III Hypertension" (≥180/≥110)
- AHA/ACC 2025: "Severe Hypertension" (asymptomatic) vs "Hypertensive Emergency" (symptomatic)

**Current Implementation:**
- `src/shared/config/index.ts:8-13` — Uses `STAGE_1`, `STAGE_2`, `CRISIS` for all guidelines
- `src/shared/config/locales/en/medical.json:5-7` — "stage1", "stage2", "crisis"

**Fix:** Create guideline-specific category keys:
```typescript
export const BP_CATEGORIES = {
  NORMAL: 'normal',
  ELEVATED: 'elevated',
  // AHA/ACC
  STAGE_1: 'stage_1',
  STAGE_2: 'stage_2',
  // ESC/JSH/WHO
  GRADE_1: 'grade_1',
  GRADE_2: 'grade_2',
  GRADE_3: 'grade_3',
  CRISIS: 'crisis', // AHA/ACC legacy
} as const;
```

---

### 8. AHA/ACC 2025 Crisis Terminology Update

**Severity:** 🟡 **HIGH**
**Impact:** Outdated crisis handling
**File:** `src/shared/ui/CrisisModal.tsx`

**Problem:** 2025 AHA/ACC retired "Hypertensive Urgency" and now distinguishes:
- **Severe Hypertension** (BP >180/120, asymptomatic)
- **Hypertensive Emergency** (BP >180/120 + symptoms + organ damage)

**Current Implementation:** Single "Hypertensive Crisis" modal with "Save Anyway" option

**Recommendation:** Add symptom questionnaire:
```typescript
if (systolic >= 180 || diastolic >= 120) {
  // Show symptom checklist
  if (hasSymptoms) {
    // Emergency: "Call 911 NOW" + list symptoms
  } else {
    // Urgency: "Contact provider TODAY" + recheck in 5 min
  }
}
```

---

### 9. Missing Optimal/Non-elevated Category

**Severity:** 🟡 **HIGH**
**Impact:** Loss of clinically relevant granularity
**Files:** All guideline implementations

**Problem:** App collapses "Optimal" / "Non-elevated" into "Normal":
- **WHO/ISH 1999:** "Optimal" (<120/<80) vs "Normal" (120-129/80-84)
- **ESC 2024:** "Non-elevated BP" (<120/<70)
- **JSH 2025:** "Normal BP" (<120/<80)

**Current Implementation:** Only has "Normal" (<120/<80 for AHA, <130/<85 for others)

**Recommendation:** Add `OPTIMAL` category for non-AHA guidelines.

---

### 10. Validation Bounds Too Permissive

**Severity:** 🟡 **HIGH**
**Impact:** Accepts physiologically implausible values
**File:** `src/shared/config/index.ts:2-7`

**Current Validation:**
```typescript
export const BP_LIMITS = {
  systolic: { min: 40, max: 300 },   // ❌ min too low
  diastolic: { min: 30, max: 200 },  // ❌ min too low
  pulse: { min: 30, max: 250 },      // ✅ correct
} as const;
```

**Problems:**
- **SBP 40 mmHg:** Incompatible with consciousness (measurement error in consumer context)
- **DBP 30 mmHg:** Near-impossible for self-measuring consumer

**Medical Device Precedent:**
- Huawei Watch BP (ISO 81060-2:2018): **60-230 mmHg**
- NCBI Clinical Methods: Minimum organ perfusion requires **SBP >90 mmHg**

**Correct Bounds:**
```typescript
export const BP_LIMITS = {
  systolic: { min: 60, max: 300 },   // ✅ 60 mmHg minimum
  diastolic: { min: 40, max: 200 },  // ✅ 40 mmHg minimum
  pulse: { min: 30, max: 250 },      // ✅ unchanged
} as const;
```

---

### 11. JSH Home BP Thresholds Not Supported

**Severity:** 🟡 **HIGH**
**Impact:** Missing central JSH feature
**File:** N/A (not implemented)

**Problem:** JSH 2025 has **complete parallel classification system** for home BP measurements:
- Hypertension: **≥135/85 mmHg** (home) vs ≥140/90 (office)
- 5 mmHg lower thresholds across all categories

**Current Implementation:** Only supports office BP thresholds

**Recommendation:** Add "Measurement Context" setting (Office / Home / Ambulatory).

---

## Medium-Priority Issues (🟢 Minor/Informational)

### 12. AHA/ACC Crisis Boundary Ambiguity

**Severity:** 🟢 **MINOR**
**Impact:** 1 mmHg difference in interpretation
**File:** `src/entities/blood-pressure/lib.ts:44`

**Current Code:**
```typescript
if (systolic >= 180 || diastolic >= 120) return BP_CATEGORIES.CRISIS;
```

**2025 AHA/ACC Text:** ">180 and/or >120" (strictly greater than)
**AHA Online Calculator:** "≥180/≥120" (greater than or equal to)

**Current Implementation:** Uses `>=` (more conservative, safer)

**Verdict:** ✅ **ACCEPTABLE** — Conservative interpretation is medically safer.

---

### 13. Treatment Goal Needs Caveats

**Severity:** 🟢 **MINOR**
**Impact:** Oversimplified guidance
**File:** N/A (future feature)

**Problem:** App may display universal "<130/80 mmHg" target, but 2025 AHA/ACC carves out exceptions:
- Pregnancy (different thresholds)
- Institutional care (individualized)
- Limited lifespan (risk/benefit balance)

**Recommendation:** Add disclaimer: "Consult provider for personalized targets."

---

### 14. Isolated Systolic Hypertension Not Flagged

**Severity:** 🟢 **MINOR**
**Impact:** Missing clinical subtype
**File:** N/A (not implemented)

**Problem:** ESC/ESH 2018 distinguished **Isolated Systolic Hypertension** (SBP ≥140 AND DBP <90) as a separate category, common in elderly.

**Current Implementation:** Categorized under "Stage 1" or "Stage 2" normally

**Recommendation:** Add badge/note when SBP high but DBP normal.

---

## Implementation Priority

### Phase 1: Critical Fixes (Must complete before any release)
1. ✅ Fix Pulse Pressure interpretation (lib.ts + medical.json)
2. ✅ Fix ESC/ESH classification gap (AND → OR logic)
3. ✅ Fix JSH DBP boundary (85 → 80) + AND/OR logic
4. ✅ Add missing crisis symptoms (medical-disclaimers.md + medical.json)

### Phase 2: High-Priority Fixes (Complete within this development cycle)
5. ✅ Tighten validation bounds (SBP 40→60, DBP 30→40)
6. ✅ Update WHO attribution (WHO 2021 → WHO/ISH 1999)
7. ✅ Create guideline-specific terminology (Grade vs Stage)
8. ⚠️ Update AHA/ACC crisis handling (symptom questionnaire)

### Phase 3: Feature Enhancements (Future roadmap)
9. Implement ESC 2024 3-category system (separate guideline option)
10. Add Optimal/Non-elevated categories for non-AHA guidelines
11. Support JSH home BP thresholds (measurement context setting)
12. Add Isolated Systolic Hypertension indicator

### Phase 4: Documentation (After code fixes)
13. Add treatment goal caveats to settings/info pages
14. Document AHA crisis boundary decision (≥ vs >)

---

## Files Requiring Changes

### Critical Priority:
- ✅ `src/entities/blood-pressure/lib.ts` (PP interpretation, ESC gap, JSH boundary)
- ✅ `src/shared/config/locales/en/medical.json` (PP ranges, crisis symptoms)
- ✅ `src/shared/config/locales/tr/medical.json` (same)
- ✅ `src/shared/config/locales/id/medical.json` (same)
- ✅ `src/shared/config/locales/sr/medical.json` (same)
- ✅ `docs/medical-disclaimers.md` (crisis symptoms)

### High Priority:
- ✅ `src/shared/config/index.ts` (BP_LIMITS, BP_CATEGORIES)
- ✅ `src/shared/config/settings.ts` (WHO comment)
- ⚠️ `src/shared/ui/CrisisModal.tsx` (symptom questionnaire)

### Testing Requirements:
- Unit tests for all classification functions
- Test cases for boundary conditions (125/87, 125/82, etc.)
- Manual testing with all 4 guidelines
- Crisis modal flow testing (with/without symptoms)

---

## Medical References

1. **AHA/ACC 2025 Guidelines**: Circulation Journal, January 2025
2. **WHO/ISH 1999**: Guidelines for the Management of Hypertension
3. **ESC/ESH 2024**: European Heart Journal, August 2024
4. **JSH 2025**: Hypertension Research, July 2025
5. **Pulse Pressure**: StatPearls, Cleveland Clinic
6. **Hypertensive Crisis**: NCBI/StatPearls NBK507701
7. **Nugroho et al.**: Annals of Medicine, 2022 (WHO attribution)

---

**Report Status:** ✅ Complete
**Next Action:** Implement Phase 1 critical fixes
**Estimated Time:** 2-3 hours (code) + 1 hour (testing)
