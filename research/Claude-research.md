# MedTracker blood pressure app: medical safety audit report

**This audit found 14 discrepancies, including 4 critical patient-safety issues, between MedTracker's blood pressure classifications and current official guidelines.** The most dangerous finding is an inverted pulse pressure range that labels a pathological reading (<40 mmHg) as "Normal," and a classification gap in the ESC/ESH and JSH implementations that leaves certain elevated diastolic readings completely unclassified. The app's AHA/ACC thresholds are largely correct, but WHO, ESC, and JSH implementations contain systematic errors in terminology, logic operators, and diastolic boundaries. Every guideline-set requires corrections before the app can be considered clinically safe.

---

## AHA/ACC 2025: thresholds correct, terminology outdated

The **2025 AHA/ACC guidelines were published August 14, 2025** in Circulation, Hypertension, and JACC, officially retiring the 2017 guidelines. The BP classification thresholds are **unchanged from 2017** — Normal (<120 AND <80), Elevated (120–129 AND <80), Stage 1 (130–139 OR 80–89), Stage 2 (≥140 OR ≥90) all match the app exactly.

The AND/OR logic is confirmed correct: Normal and Elevated require both conditions (AND), while Stage 1, Stage 2, and crisis use OR logic, meaning the higher category always governs. A test case of SBP 125/DBP 85 correctly classifies as Stage 1 via the diastolic criterion alone.

Three issues require attention. First, the **crisis threshold has a 1 mmHg boundary ambiguity**: the 2025 guideline text uses ">180 and/or >120" (strictly greater than), while the AHA's own online calculator uses "≥180" (greater than or equal to). The app uses ≥180/≥120, which is the more conservative and safer interpretation. Second, the 2025 guidelines **retired the term "hypertensive urgency"** and now distinguish between "Severe Hypertension" (asymptomatic, BP >180/120) and "Hypertensive Emergency" (symptomatic with organ damage). The app's single "Hypertensive Crisis" category should be split accordingly. Third, the treatment goal of **<130/80 is correct for most adults** but the 2025 guidelines carve out exceptions for pregnancy (different thresholds), institutional care, and limited lifespan — the app should note these caveats.

| App category | App threshold | 2025 AHA/ACC | Verdict |
|---|---|---|---|
| Normal | SBP <120 AND DBP <80 | SBP <120 and DBP <80 | ✅ Match |
| Elevated | SBP 120–129 AND DBP <80 | SBP 120–129 and DBP <80 | ✅ Match |
| Stage 1 HTN | SBP 130–139 OR DBP 80–89 | SBP 130–139 or DBP 80–89 | ✅ Match |
| Stage 2 HTN | SBP ≥140 OR DBP ≥90 | SBP ≥140 or DBP ≥90 | ✅ Match |
| Hypertensive Crisis | SBP ≥180 OR DBP ≥120 | SBP >180 and/or DBP >120 | ⚠️ Boundary + terminology |
| Treatment goal | <130/80 all adults | <130/80 with exceptions | ⚠️ Needs caveats |

---

## WHO 2021: classification does not exist in this guideline

**The WHO 2021 guideline (WHO/UCN/NCD/20.07) does not contain a blood pressure classification table.** It addresses only pharmacological treatment thresholds and targets. A peer-reviewed comparison (Nugroho et al., Annals of Medicine, 2022) explicitly confirms: "This classification is not included in the WHO guidelines, which focus more on pharmacological treatment." The app's claimed "WHO 2021" thresholds actually derive from the **WHO/ISH 1999 classification** — a fundamentally different and much older document. This attribution error must be corrected.

Against the WHO/ISH 1999 source, the numerical thresholds for Normal (<130/<85), High Normal (130–139/85–89), and Grades 1–3 all match. The OR logic for High Normal and higher categories is correct, per the WHO/ISH 1999 rule that "the higher category should apply." However, **five terminology errors** exist: WHO uses "Grade 1/2/3" not "Stage 1/2," the term "Elevated" is AHA/ACC vocabulary (WHO calls it "High-normal"), and "Hypertensive Crisis" is not a WHO classification category — WHO/ISH 1999 calls ≥180/≥110 "Grade 3 (severe)." Additionally, the app omits the WHO/ISH 1999 **"Optimal" category (<120/<80)**, collapsing it into "Normal" and losing clinically relevant granularity.

The treatment goals are the one area where WHO 2021 directly applies, and the app is correct: **<140/90 general, <130 systolic with CVD**. WHO 2021 also recommends <130 systolic for diabetes and chronic kidney disease (conditional recommendation), which the app does not mention. The WHO 2021 guideline remains current as of February 2026 with no subsequent updates.

---

## ESC 2024 introduced a radically new 3-category system

The **2024 ESC Guidelines** (McEvoy et al., European Heart Journal, August 2024) replaced the traditional six-tier Optimal/Normal/High Normal/Grade 1/2/3 system with just three categories. This is a fundamental paradigm shift the app does not reflect:

| 2024 ESC category | Systolic | Logic | Diastolic |
|---|---|---|---|
| Non-elevated BP | <120 | AND | <70 |
| Elevated BP | 120–139 | OR | 70–89 |
| Hypertension | ≥140 | OR | ≥90 |

The app's five-category ESC/ESH implementation matches neither the 2024 ESC nor the previous 2018 ESC/ESH guidelines correctly. Most critically, **the diastolic boundaries have shifted**: the 2024 ESC uses 70 mmHg (not 80 or 85) as the boundary between non-elevated and elevated. The app uses 85, which is 15 mmHg too high.

Against the superseded 2018 ESC/ESH guidelines (which used the Grade 1/2/3 system), the app has a **critical classification gap**. The app defines "Elevated (High Normal)" as SBP 130–139 **AND** DBP <85, but the 2018 ESC/ESH "High Normal" was SBP 130–139 **AND/OR** DBP 85–89. A patient with BP 125/87 falls into **no category whatsoever** in the app — Normal requires DBP <85 (fails), Elevated requires SBP 130–139 (fails), and Stage 1 requires SBP ≥140 or DBP ≥90 (fails). Under 2018 ESC/ESH, this patient is "High Normal"; under 2024 ESC, they are "Elevated BP." **This unclassified gap is a patient safety hazard.**

Additional terminology issues: ESC/ESH uses "Grade 1/2/3" not "Stage 1/2"; ESC/ESH calls ≥180/≥110 "Grade 3 Hypertension" not "Hypertensive Crisis"; and the 2018 ESC/ESH included "Isolated Systolic Hypertension" (SBP ≥140 AND DBP <90) as a distinct category the app omits entirely.

---

## JSH 2025 is not identical to ESC/ESH despite the app's assumption

The **JSH 2025 guidelines** were published July 25, 2025 in Hypertension Research, with BP classification unchanged from JSH 2019. The app's assumption that JSH equals ESC/ESH is **incorrect** — a key structural difference exists in the sub-hypertensive diastolic boundary.

JSH splits its "Elevated BP" category at **DBP 80 mmHg**, while ESC/ESH 2018 splits "High Normal" at **DBP 85 mmHg**. This means a patient with SBP 125/DBP 82 is "Elevated BP" under JSH (because DBP 80–89 triggers the category) but merely "Normal" under ESC/ESH 2018 (where "Normal" encompasses DBP 80–84). The app uses the ESC/ESH boundary of 85 for its JSH implementation, **missing all patients with DBP 80–84 who should be flagged as "Elevated BP" per JSH**.

The same critical AND/OR logic gap exists: JSH defines Elevated BP as SBP 130–139 **AND/OR** DBP 80–89, but the app uses AND logic with the wrong diastolic threshold. JSH also has unique features the app lacks: a complete parallel classification system for **home BP measurements** (thresholds 5 mmHg lower than office, e.g., hypertension at ≥135/85 vs ≥140/90 for office) and universal treatment targets of <130/80 without age-based exceptions (JSH 2025 removed the previous elderly target of <140/90).

| Feature | JSH 2019/2025 | ESC/ESH 2018 | App (claims both) |
|---|---|---|---|
| Sub-HTN DBP boundary | **80 mmHg** | **85 mmHg** | 85 mmHg ❌ for JSH |
| "Elevated" DBP range | 80–89 | 85–89 | <85 (AND) ❌ for both |
| Category names | Grade I/II/III | Grade 1/2/3 | Stage 1/2 ❌ |
| Optimal category | "Normal BP" (<120/80) | "Optimal" (<120/80) | Merged into "Normal" |
| Home BP thresholds | Full parallel system | Not provided | Not implemented |

---

## Pulse pressure ranges are inverted — the most dangerous error found

The pulse pressure formula (PP = SBP − DBP) and MAP formula (MAP = [SBP + 2×DBP] / 3) are both correct. However, **the pulse pressure classification ranges are wrong and clinically dangerous**.

The app labels PP <40 mmHg as "Normal." In reality, a pulse pressure below 40 mmHg is **abnormally narrow** and can indicate decreased cardiac output, heart failure, significant blood loss, aortic stenosis, or cardiac tamponade. StatPearls states: "Normal pulse pressure is approximately **40 mmHg**." Cleveland Clinic confirms: "A normal pulse pressure is **40 mmHg**." The correct ranges are:

| Category | App (WRONG) | Correct range | Clinical significance |
|---|---|---|---|
| Low (narrow) | — | **<40 mmHg** | Heart failure, blood loss, aortic stenosis |
| Normal | <40 mmHg ❌ | **40–60 mmHg** | Healthy cardiovascular function |
| Borderline | 40–60 mmHg ❌ | — | Not a standard category |
| High (wide) | >60 mmHg | **>60 mmHg** ✅ | Arterial stiffness, increased CV risk |

**This inversion means the app would reassure a patient with dangerously narrow pulse pressure (e.g., PP of 25 in heart failure) that their reading is "Normal," while flagging a perfectly healthy PP of 45 as "Borderline."** This must be corrected immediately.

The MAP normal range of **70–100 mmHg is correct**, consistent with Oxford Academic, GlobalRPH, and standard clinical references. The critical perfusion minimum is 60 mmHg, below which organ damage occurs.

---

## Validation ranges need tighter lower bounds

The app's physiological validation ranges are mostly sound but the **lower bounds are too permissive** for a consumer health app:

**Systolic 40–300 mmHg**: The minimum of 40 is problematic. An SBP of 40 mmHg is incompatible with consciousness and essentially indicates measurement error in a consumer context. Medical device precedent supports higher minimums — the Huawei Watch BP monitor (validated to ISO 81060-2:2018) uses **60–230 mmHg**. NCBI Clinical Methods states minimum acceptable SBP for organ perfusion is "usually more than 90 mm Hg." Recommendation: raise to **60 mmHg minimum**.

**Diastolic 30–200 mmHg**: Similarly, DBP of 30 is near-impossible in a self-measuring consumer. Hypotension is defined as <90/60 (AHA, Cleveland Clinic). Recommendation: raise to **40 mmHg minimum**.

**Pulse 30–250 BPM**: Appropriate. Athletes can have resting HR in the low 30s (Miguel Indurain recorded 28 BPM), and SVT can exceed 250 BPM. The range captures clinically valid extremes.

**SBP > DBP logic**: Correct and physiologically mandatory. The upper bounds (300 SBP, 200 DBP) are acceptable — extreme BP readings up to 370/360 have been documented during heavy resistance exercise, and clinical hypertensive crises can produce readings of 260–300+.

---

## Crisis symptoms list is missing three AHA-specified items

The hypertensive emergency vs. urgency distinction is clinically correct. The 2025 AHA guidelines now use "Severe Hypertension" (asymptomatic) and "Hypertensive Emergency" (symptomatic with organ damage), retiring the term "urgency." The recommended actions — call 911 for emergency, same-day provider evaluation for urgency — are appropriate per AHA guidance.

The app's symptom list is **incomplete**. The AHA's published emergency symptom list includes three items the app omits:

- **Back pain** — critical indicator of aortic dissection, a life-threatening emergency
- **Numbness** — sign of stroke or neurological damage
- **Weakness** — sign of stroke or neurological damage

Additional symptoms supported by clinical literature (StatPearls, AHA Journals) that merit consideration include confusion/altered mental status (hypertensive encephalopathy), seizures, and nausea/vomiting. At minimum, **back pain, numbness, and weakness must be added** to match the AHA's own published list.

---

## Consolidated findings and priority corrections

The following table summarizes all discrepancies ranked by severity. Items marked 🔴 are critical patient-safety issues requiring immediate correction; 🟡 items are clinically significant errors; 🟢 items are minor or informational.

| # | Severity | Guideline | Issue |
|---|---|---|---|
| 1 | 🔴 | All | **Pulse pressure <40 labeled "Normal" — should be "Low/Narrow"** (indicates heart failure, blood loss) |
| 2 | 🔴 | ESC/ESH | **Classification gap: DBP 85–89 with SBP <130 falls into no category** |
| 3 | 🔴 | JSH | **DBP boundary wrong (uses 85, should be 80) and AND/OR logic error creates unclassified readings** |
| 4 | 🔴 | All | **Missing emergency symptoms: back pain, numbness, weakness** per AHA list |
| 5 | 🟡 | WHO | Attribution error — WHO 2021 has no classification; thresholds are from WHO/ISH 1999 |
| 6 | 🟡 | ESC | App uses superseded 2018 framework; 2024 ESC uses 3-category system with DBP 70 boundary |
| 7 | 🟡 | WHO/ESC/JSH | Terminology wrong: all three use "Grade" not "Stage"; none use "Hypertensive Crisis" as a category |
| 8 | 🟡 | AHA/ACC | "Hypertensive Crisis" should split into "Severe Hypertension" + "Hypertensive Emergency" per 2025 |
| 9 | 🟡 | All | Missing "Optimal" / "Non-elevated" lowest-risk category across all non-AHA guidelines |
| 10 | 🟡 | Validation | SBP minimum 40 too low — raise to 60; DBP minimum 30 too low — raise to 40 |
| 11 | 🟡 | JSH | No home BP classification support (a central JSH feature with different thresholds) |
| 12 | 🟢 | AHA/ACC | Crisis boundary: ≥180 vs >180 (1 mmHg ambiguity; AHA's own materials inconsistent) |
| 13 | 🟢 | AHA/ACC | Treatment goal needs pregnancy/institutional care/limited lifespan caveats |
| 14 | 🟢 | ESC/JSH | Missing "Isolated Systolic Hypertension" category (SBP ≥140 AND DBP <90) |

## Conclusion

The audit reveals that MedTracker's AHA/ACC implementation is substantially correct and requires only terminology updates to align with the August 2025 guideline revision. The international implementations (WHO, ESC, JSH), however, contain structural errors that create real patient-safety risks — most critically the AND/OR logic errors that leave certain blood pressure readings completely unclassified. The pulse pressure range inversion is the single most dangerous finding: it transforms a warning signal for heart failure into a false reassurance of normalcy. These four critical issues (pulse pressure ranges, ESC classification gap, JSH boundary/logic errors, and missing emergency symptoms) should be addressed before any app release. The remaining terminology and attribution corrections, while clinically important for guideline fidelity, pose lower immediate risk to users.