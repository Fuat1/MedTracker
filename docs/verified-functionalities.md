# MedTracker — Verified Implemented Functionalities

> Last verified: 2026-03-28

---

## 1. Blood Pressure Recording

- **Full BP entry** (systolic, diastolic, pulse) via Numpad — no TextInput
- **Quick Log** mode with auto-advance numpad for faster entry
- **Voice logging** (iOS Siri Shortcuts) via deep link `medtracker://log?sys=X&dia=Y`
- **Voice Confirmation page** for reviewing voice-entered readings before saving
- **Edit reading** — update all fields, metadata, and tags
- **Delete reading** with confirmation dialog
- **Input validation**: SBP 40–300, DBP 30–200, Pulse 30–250 mmHg/BPM; enforces SBP > DBP
- **Crisis detection** — modal alert on readings ≥ 180/120 (AHA/ACC) or ≥ 180/110 (WHO/ESC/JSH)
- **Morning surge detection** — compares morning reading to previous evening
- **Optional fields**: weight, location, posture, datetime picker
- **Lifestyle tag association** per record

---

## 2. BP Classification

- **4 international guidelines**: AHA/ACC (2025), ESC/ESH (2018), JSH (2025), WHO/ISH (1999)
- **User-selectable guideline** in Settings → Classification
- **Category colors and labels**: Normal, Elevated, Stage 1 Hypertension, Stage 2 Hypertension, Crisis
- **Thresholds imported from typed constants** — never hardcoded inline (`src/shared/config/bp-guidelines.ts`)
- **Visual threshold reference** in Classification Settings page

---

## 3. Derived Metrics

- **Pulse Pressure (PP)** = Systolic − Diastolic
- **Mean Arterial Pressure (MAP)** = (Systolic + 2 × Diastolic) / 3
- Both displayed on Home dashboard with explanation modals
- Optionally included in PDF reports

---

## 4. Pre-Measurement Workflow

- **Measurement checklist** (position, rest, posture) on `PreMeasurementPage`
- **4-7-8 breathing technique** with animated phase indicators (inhale 4s / hold 7s / exhale 8s)
- **5-minute countdown timer** before recording
- Skip option with warning

---

## 5. Analytics Dashboard

- **7-day trend chart** (systolic/diastolic area chart) on Home
- **Full analytics page** with period selector: 7d, 14d, 30d, 90d, all-time, custom date range
- **Weekly average** and AM vs PM comparison
- **Circadian time-in-range** percentages (morning / day / evening / night windows)
- **Morning surge alert badge**
- **Weight trend** (min/max/avg) with BMI context
- **Weight–BP correlation** (Pearson coefficient)
- **Lifestyle tag correlations** — top tags correlated with higher/lower BP
- **Doctor notes** text field on analytics page

---

## 6. History

- **Full reading history** with time-period grouping (today / this week / this month / older)
- **Record cards** with all metrics, timestamp, category badge, tags
- **Edit and delete** actions per record
- **FlashList** for performance on large datasets

---

## 7. Medications

- **Add / edit / delete** medications (name, dosage, frequency, reminder times)
- **Today's schedule** view with adherence tracking
- **Mark doses as taken or skipped**
- **Local notification reminders** via Notifee (iOS + Android)
- **Reminder cancellation** when medication is deleted

---

## 8. Health Platform Sync

- **Apple Health** (iOS): bidirectional sync — export local records, import last 30 days
- **Health Connect** (Android): bidirectional sync — export local records, import last 30 days
- **Permission handling** per platform
- **Conflict resolution** by timestamp + value matching (no duplicates)
- **Sync Settings page** with cloud backup options

---

## 9. PDF Export

- **Professional medical report** generated from HTML template
- **Configurable period** (7d / 30d / 90d / all-time / custom)
- **Statistics block**: avg, min, max, reading count, crisis count, category distribution
- **SVG BP trend chart** embedded in report
- **Optional PP/MAP section**
- **Doctor notes** inclusion
- **Medical disclaimer** footer
- Share sheet integration; file saved to device documents

---

## 10. User Profile & Personal Info

- **Name**, date of birth (age calculation), gender
- **Height**: cm or feet+inches with unit conversion
- **Weight**: kg or lbs with unit conversion
- **BMI calculation** and category (underweight / normal / overweight / obese)
- **Profile badges** shown on Home and Analytics (age, BMI category)

---

## 11. Lifestyle Tags

- **Predefined tags**: sleep, stress, exercise, alcohol, caffeine, salt, hydration, illness
- **Custom tag creation** and deletion
- **Tag selector modal** with multi-select and animation
- **Tag correlation analysis**: Pearson coefficient between tag frequency and BP values

---

## 12. Settings

| Setting | Options |
|---|---|
| Theme | Light / Dark |
| Language | English / Turkish / Serbian / Indonesian |
| BP Guideline | AHA/ACC / ESC/ESH / JSH / WHO |
| Senior Mode | 1.4× font scaling |
| Weight Unit | kg / lbs |
| Height Unit | cm / feet+inches |
| Default Location | Selectable |
| Default Posture | Selectable |
| Voice Logging | Enable / Disable |

---

## 13. Native Integrations

### iOS
- **App Intent** (`LogBloodPressureIntent.swift`) for iOS 16+ Siri Shortcuts
  - Siri phrases: "Log my blood pressure in MedTracker", "Add a reading in MedTracker"
  - Parameters: systolic, diastolic, pulse (optional)
  - Triggers deep link to VoiceConfirmation page

### Android
- **App shortcuts** (`shortcuts.xml`) for launcher quick actions
- **Health Connect** API integration

### Deep Linking
- Scheme: `medtracker://`
- Route: `log?sys=X&dia=Y&pulse=Z`

---

## 14. App Architecture & Infrastructure

- **FSD (Feature-Sliced Design)** layered architecture
- **SQLite + SQLCipher** encrypted local database via op-sqlite (JSI)
- **TanStack Query** for data fetching, caching, and invalidation
- **Zustand** for client/UI state (settings store, theme)
- **React Navigation** Stack + Tabs with modal presentations
- **NativeWind + Reanimated** for styling and animations
- **i18n** multi-language support (en, tr, sr, id)
- **Error Boundaries** at page level
- **Notification Service** (Notifee) with background event handler
- **React Query DevTools** (dev builds)

---

## 15. UI Components (Shared)

| Component | Description |
|---|---|
| `<Numpad />` | Custom numeric input — used for all BP/weight entry |
| `<Button />` | Variants: primary, secondary, ghost, destructive, icon, fab, link |
| `<Card />` | Variants: elevated, outline, ghost, filled, pressable, gradient |
| `<BPTrendChart />` | 7-day systolic/diastolic area chart with zone bands |
| `<DonutChart />` | Time-in-range donut visualization |
| `<CircadianBreakdownBars />` | Per-window horizontal bar chart |
| `<CrisisModal />` | High-BP warning confirmation modal |
| `<DerivedMetricsModal />` | PP/MAP explanation modal |
| `<TagSelector />` | Animated multi-select tag modal |
| `<Toast />` | Floating notification messages |
| `<DateTimePicker />` | Date and time selection |
| `<BreathingGuide />` | Animated 4-7-8 breathing phase guide |
| `<PageHeader />` | Dynamic greeting + analytics header variants |
| `<StatCard />` | Statistic display card |
| `<OptionChip />` | Filter/toggle chip buttons |
| `<SaveButton />` | Contextual save with loading state |

---

## 16. Test Coverage

| Module | Test File |
|---|---|
| BP Classification | `blood-pressure/lib.test.ts` |
| Circadian Analysis | `blood-pressure/circadian-classification.test.ts` |
| Report Statistics | `export-pdf/compute-report-stats.test.ts` |
| Chart SVG Generation | `export-pdf/generate-bp-chart-svg.test.ts` |
| Report HTML Template | `export-pdf/generate-report-html.test.ts` |
| Health Sync Hook | `health-sync/useSyncHealthPlatform.test.tsx` |
| User Profile | `user-profile/lib.test.ts` |
| Circadian Utils | `shared/lib/circadian-utils.test.ts` |
| Greeting Utils | `shared/lib/greeting-utils.test.ts` |
| Index Utils | `shared/lib/index-utils.test.ts` |
| Typography Scale | `shared/config/typography-scale.test.ts` |
| Apple Health API | `shared/api/health-platform/apple-health.test.ts` |
| Health Connect API | `shared/api/health-platform/health-connect.test.ts` |
| Button Component | `shared/ui/Button/__tests__/Button.test.ts` |
| Card Component | `shared/ui/Card/__tests__/Card.test.ts` |
