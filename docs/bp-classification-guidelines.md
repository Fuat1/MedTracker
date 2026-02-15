# Blood Pressure Classification Guidelines

MedTracker supports 4 official international guidelines. Classification logic lives in `src/entities/blood-pressure/lib.ts`, with constants in `src/shared/config/`.

## AHA/ACC (2025) - USA Standard [Default]

**Source**: [Circulation Journal](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001356) (January 2025)

| Category | Systolic (mmHg) | Diastolic (mmHg) | Color | Logic |
|----------|----------------|-----------------|-------|-------|
| Normal | <120 | AND <80 | Green | SBP<120 AND DBP<80 |
| Elevated | 120-129 | AND <80 | Yellow | SBP 120-129 AND DBP<80 |
| Stage 1 Hypertension | 130-139 | OR 80-89 | Orange | SBP 130-139 OR DBP 80-89 |
| Stage 2 Hypertension | ≥140 | OR ≥90 | Red | SBP≥140 OR DBP≥90 |
| Hypertensive Crisis | ≥180 | OR ≥120 | Deep Red | SBP≥180 OR DBP≥120 |

**Treatment Goal**: <130/80 mmHg for all adults

## WHO/ISH (1999) - International Standard

**Note**: The WHO 2021 guideline (WHO/UCN/NCD/20.07) contains no BP classification table — it addresses pharmacological treatment thresholds only. These categories are from the **WHO/ISH 1999** classification system (confirmed by Nugroho et al., Annals of Medicine, 2022).

| Category | Systolic (mmHg) | Diastolic (mmHg) | Logic |
|----------|----------------|-----------------|-------|
| Normal | <130 | AND <85 | SBP<130 AND DBP<85 |
| Elevated (High Normal) | 130-139 | OR 85-89 | SBP 130-139 OR DBP 85-89 |
| Stage 1 Hypertension | 140-159 | OR 90-99 | SBP 140-159 OR DBP 90-99 |
| Stage 2 Hypertension | 160-179 | OR 100-109 | SBP 160-179 OR DBP 100-109 |
| Hypertensive Crisis | ≥180 | OR ≥110 | SBP≥180 OR DBP≥110 |

**Treatment Goal** (from WHO 2021): <140/90 mmHg (general), <130 systolic (with CVD)

## ESC/ESH (2018 framework) - European Standard

**Source**: European Society of Cardiology / European Society of Hypertension (2018)
**Note**: ESC 2024 introduced a new 3-category system (Non-elevated/Elevated/Hypertension with DBP 70 boundary) — not yet implemented. Current app uses 2018 framework.

| Category | Systolic (mmHg) | Diastolic (mmHg) | Logic |
|----------|----------------|-----------------|-------|
| Normal | <130 | AND <85 | SBP<130 AND DBP<85 |
| Elevated (High Normal) | 130-139 | OR 85-89 | SBP≥130 OR DBP 85-89 |
| Stage 1 Hypertension | ≥140 | OR ≥90 | SBP≥140 OR DBP≥90 |
| Stage 2 Hypertension | ≥160 | OR ≥100 | SBP≥160 OR DBP≥100 |
| Hypertensive Crisis | ≥180 | OR ≥110 | SBP≥180 OR DBP≥110 |

## JSH (2025) - Japanese Standard

**Source**: Japanese Society of Hypertension (2025, thresholds unchanged from JSH 2019)
**Key difference from ESC/ESH**: DBP boundary for Elevated is **80 mmHg** (not 85)

| Category | Systolic (mmHg) | Diastolic (mmHg) | Logic |
|----------|----------------|-----------------|-------|
| Normal | <130 | AND <80 | SBP<130 AND DBP<80 |
| Elevated (Elevated BP) | 130-139 | OR 80-89 | SBP≥130 OR DBP 80-89 |
| Stage 1 Hypertension | ≥140 | OR ≥90 | SBP≥140 OR DBP≥90 |
| Stage 2 Hypertension | ≥160 | OR ≥100 | SBP≥160 OR DBP≥100 |
| Hypertensive Crisis | ≥180 | OR ≥110 | SBP≥180 OR DBP≥110 |

## Hypertensive Crisis Guidance

**Crisis Threshold Differences**:
- AHA/ACC: ≥180/120 mmHg
- WHO/ESC/JSH: ≥180/110 mmHg

**Emergency vs Urgency**:
- **Emergency** (with symptoms): Chest pain, shortness of breath, severe headache, vision changes, difficulty speaking, back pain, numbness, or weakness → **Call 911 / emergency services immediately**
- **Urgency** (without symptoms): Contact healthcare provider immediately for same-day evaluation

**App Behavior**:
1. Display prominent modal warning (cannot be dismissed without acknowledgment)
2. Show crisis threshold exceeded
3. Provide symptom checklist
4. Include emergency contact guidance
5. Require explicit "Save Anyway" confirmation

## Implementation Notes

- **NEVER hardcode these thresholds** in UI code
- Classification logic in `entities/blood-pressure/lib.ts`, constants in `shared/config/`
- User selects guideline in Settings → stored in `settings-store`
- `isCrisisReading()` accepts guideline parameter — crisis detection is guideline-aware
- PDF reports include guideline name in header

**Last Updated**: 2026-02-15
