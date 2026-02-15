# Required Medical Disclaimers

All user-facing health information MUST include appropriate disclaimers.

## General App Disclaimer

**Location**: Settings → About / First-time onboarding

```
MedTracker is a blood pressure logging and tracking tool for informational
purposes only. It is NOT a medical device and does NOT measure blood pressure.

This app does not provide medical advice, diagnosis, or treatment. All health
data and classifications are based on published medical guidelines but should
not replace professional medical evaluation.

Always consult a qualified healthcare provider for medical advice, diagnosis,
and treatment decisions. In case of emergency, call 911 or your local emergency
services immediately.
```

## PDF Report Disclaimer

**Location**: Footer of every exported PDF report

```
DISCLAIMER: This report is generated for informational purposes only and is not
a substitute for professional medical advice, diagnosis, or treatment. Blood
pressure classifications are based on [Guideline Name] guidelines. Consult your
healthcare provider to interpret these readings in the context of your overall
health status and medical history.
```

## Crisis Warning Disclaimer

**Location**: Hypertensive crisis modal (≥180/120 or ≥180/110)

```
⚠️ HYPERTENSIVE CRISIS DETECTED

Your reading of [SBP/DBP] mmHg significantly exceeds normal limits.

IF YOU EXPERIENCE ANY OF THESE SYMPTOMS:
• Severe chest pain
• Severe headache
• Shortness of breath
• Vision changes or blurriness
• Difficulty speaking
• Back pain (may indicate aortic dissection)
• Numbness or tingling
• Weakness (especially on one side)

➡️ CALL 911 / EMERGENCY SERVICES IMMEDIATELY

If you have NO symptoms, contact your healthcare provider immediately for
same-day evaluation. Do not wait for a scheduled appointment.

This app is not a medical device. This is an automated warning based on
published medical guidelines and does not constitute medical advice.
```

## Derived Metrics Disclaimer (PP/MAP)

**Location**: DerivedMetricsModal footer

```
Based on AHA/ACC guidelines. Pulse Pressure and Mean Arterial Pressure are
calculated values for informational purposes. Consult your healthcare provider
for interpretation and clinical significance.
```

## Pre-Measurement Guidance Disclaimer

**Location**: PreMeasurementPage header

```
These preparation steps are based on American Heart Association guidelines for
accurate blood pressure measurement. Following these steps improves measurement
reliability but does not replace proper medical evaluation.
```

## Settings Page Medical Guideline Disclaimer

**Location**: Settings → Guideline Selection

```
Classification guidelines shown are from official medical organizations (AHA/ACC,
WHO, ESC/ESH, JSH). Your healthcare provider may use different thresholds based
on your individual health status, age, and risk factors. Always follow your
provider's recommendations.
```

## Implementation Notes

- Store disclaimer text in `src/shared/config/locales/[lang]/medical.json` for i18n support
- Use consistent formatting (bold for emergency actions, clear hierarchy)
- NEVER remove or minimize disclaimers to improve UI aesthetics
- Include disclaimer in `<CrisisModal>`, PDF exports, and first-time app launch
- Update disclaimers if medical guidelines change

**Last Updated**: 2026-02-14
