# Medical Safety Rules (Always Active)

These rules apply universally across all MedTracker development.

## Input Validation (MUST)

- **Systolic BP**: 40-300 mmHg (reject outside range)
- **Diastolic BP**: 30-200 mmHg (reject outside range)
- **Pulse**: 30-250 BPM (optional field)
- **Logic check**: MUST enforce Systolic > Diastolic

## Classification Safety (MUST)

- **NEVER hardcode BP thresholds** — import from `src/shared/config/bp-guidelines.ts`
- **Support all 4 guidelines**: AHA/ACC (2025), WHO (2021), ESC/ESH (2024), JSH
- **Default guideline**: AHA/ACC 2025
- **Crisis threshold**: ≥180/120 (AHA/ACC) or ≥180/110 (WHO/ESC/JSH)
- **Crisis warnings MUST** display prominent modal with medical guidance

## Medical Disclaimers (MUST)

- **ALL** health-related UI MUST include: "Consult healthcare provider for medical advice"
- **PDF reports MUST** include: "For informational purposes only. Not a substitute for professional medical advice"
- **Crisis alerts MUST** distinguish Emergency (with symptoms → call 911) vs Urgency (without symptoms → contact provider)

## Data Privacy (MUST)

- **NO cloud uploads** without explicit user consent
- **SQLCipher encryption** for database
- **Local-first storage** — app works fully offline
- **Backup to Google Drive** uses appDataFolder scope only (not user-accessible)

## Prohibited Actions (MUST NOT)

- ❌ Generate diagnostic recommendations ("You have hypertension")
- ❌ Suggest medication changes
- ❌ Provide treatment plans
- ❌ Access user data without encryption
- ❌ Store medical data in plain text
- ❌ Use external analytics that collect health data
