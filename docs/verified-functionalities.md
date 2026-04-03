# MedTracker — Verified Implemented Functionalities

> Last verified: 2026-04-03 (comprehensive codebase scan)

---

## 1. Blood Pressure Recording

- **Full BP entry** (systolic, diastolic, pulse) via Numpad — no TextInput
- **NewReadingPage** — guided entry mode with manual field switching
- **Quick Log** mode with auto-advance numpad for faster entry (QuickLogPage)
- **Voice logging** (iOS Siri Shortcuts) via deep link `medtracker://log?sys=X&dia=Y`
- **VoiceConfirmationPage** — review and edit voice-entered readings before saving; supports natural language queries via voice-query-parser
- **Edit reading** — EditReadingPage with full field updates (systolic, diastolic, pulse, weight, location, posture, timestamp, tags)
- **Delete reading** with confirmation dialog
- **Input validation**: SBP 40–300, DBP 30–200, Pulse 30–250 mmHg/BPM; enforces SBP > DBP
- **Crisis detection** — modal alert on readings ≥ 180/120 (AHA/ACC) or ≥ 180/110 (WHO/ESC/JSH)
- **Morning surge detection** — compares morning reading to previous evening (displayed on Analytics page)
- **Optional fields**: weight, location, posture, datetime picker
- **Lifestyle tag association** per record via TagPickerModal
- **Entry mode preference** — user can set preference for Quick Log vs Guided entry in Settings

---

## 2. BP Classification

- **4 international guidelines**: AHA/ACC (2025), ESC/ESH (2018), JSH (2025), WHO/ISH (1999)
- **User-selectable guideline** in Settings → Classification
- **Category colors and labels**: Normal, Elevated, Stage 1 Hypertension, Stage 2 Hypertension, Crisis
- **Thresholds imported from typed constants** — never hardcoded inline (`src/shared/config/bp-guidelines.ts`)
- **Visual threshold reference** in Classification Settings page

---

## 2.5. Region Detection

- **ClassificationPage** with "Detect My Region" button
- **Automatic region detection** via `detectCountryCode()` using device locale + timezone heuristics
- **Guideline recommendation** via `getSettingsForRegion()` — maps country codes to appropriate BP guidelines:
  - US → AHA/ACC
  - Japan → JSH
  - Europe (30+ countries) → ESC/ESH
  - Rest of world → WHO/ISH (fallback)
- **Inline detection result** displays detected country and applied guideline after detection
- **Medical disclaimer** — "Please double-check with your doctor" reminder
- **Visual threshold reference** chart showing BP classification ranges for selected guideline

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

### Home Page
- **7-day trend chart** (systolic/diastolic area chart) with category zone bands
- **Latest reading card** with BP classification, category color gradient, timestamp
- **Derived metrics** — Pulse Pressure (PP) and Mean Arterial Pressure (MAP) with info modals
- **Profile badges** — age and BMI category
- **Dynamic greeting** — time-of-day aware (morning/afternoon/evening)
- **Medication schedule card** — today's medications (if any exist)

### Analytics Page
- **Dedicated full analytics page** accessible from Home
- **Period selector**: 7d, 14d, 30d, 90d, all-time, custom date range with date pickers
- **Statistics summary**: average, min, max, reading count, crisis count
- **BP category distribution** — percentage breakdown by classification
- **BPTrendChart** — full historical systolic/diastolic area chart with category zones
- **Weekly average** and AM vs PM comparison
- **CircadianCard** — time-in-range percentages (morning / day / evening / night windows) with donut chart and breakdown bars
- **Morning surge alert badge** with detection explanation
- **Weight trend** (min/max/avg) with BMI context and weight–BP correlation (Pearson coefficient)
- **Lifestyle tag correlations** — CorrelationCard showing top tags correlated with higher/lower BP
- **Medication correlation** — impact of medication adherence on BP readings
- **WeatherCorrelationCard** — weather factor correlations (if weather feature enabled)
- **Doctor notes** text field (persisted in app state, included in PDF export)
- **PDF export controls** — toggle PP/MAP inclusion, export button with share sheet

---

## 6. History

- **HistoryPage** — full reading history with time-period grouping (today / this week / this month / older)
- **Owner filter** — filter by "My Readings" or linked person's display name (family sharing)
- **BPRecordCard** — displays systolic/diastolic, pulse (if present), weight (if present), category badge, timestamp, location, posture, lifestyle tags
- **Edit and delete** actions per record
- **BPRecordsList widget** — FlashList implementation for performance on large datasets (100+ records)
- **Visual category indicators** — color-coded badges per BP classification
- **Swipe actions** (planned in UI but currently using tap-to-actions pattern)

---

## 7. Medications

- **MedicationPage** — full medication management interface
- **Add / edit / delete** medications via MedicationModal (name, dosage, frequency, reminder times)
- **Today's schedule** — TodayScheduleCard widget showing scheduled doses
- **Adherence tracking** — mark doses as taken or skipped
- **Medication correlation analysis** — impact of adherence on BP readings (displayed on Analytics page)
- **Local notification reminders** via Notifee (iOS + Android)
- **Background notification handler** — supports marking doses as taken from notification actions
- **Reminder cancellation** when medication is deleted
- **Persistent storage** via medication-repository (SQLite)

---

## 8. Health Platform Sync

- **Apple Health** (iOS): bidirectional sync — export local records, import last 30 days
- **Health Connect** (Android): bidirectional sync — export local records, import last 30 days
- **Permission handling** per platform
- **Conflict resolution** by timestamp + value matching (no duplicates)
- **Sync Settings page** with cloud backup options

---

## 9. Weather Correlation

- **Opt-in feature** — disabled by default, enabled via Settings → Weather
- **Data source**: Open-Meteo API (free, no API key, privacy-respecting)
- **Location modes**: GPS (on-device) or City Search (Open-Meteo geocoding)
- **Temperature units**: °C / °F (user-selectable)
- **Weather captured at BP save time** — fire-and-forget, never blocks BP recording
- **Metrics stored**: barometric pressure, temperature, humidity, wind speed, WMO weather code
- **Correlation analysis**: median-split algorithm comparing BP across high/low weather conditions; requires ≥5 paired readings and ≥3 mmHg meaningful delta
- **WeatherCorrelationCard** on Analytics page — shows per-factor insights with medical disclaimer
- **WeatherSettingsPage**: master toggle, GPS/city mode, city autocomplete search, temperature unit toggle, privacy note
- **Permission handling**: GPS denial shows toast directing user to city mode
- **Data retention**: `weather_readings` table — CASCADE deletes with parent BP record

---

## 10. PDF Export

- **Professional medical report** generated from HTML template
- **Configurable period** (7d / 30d / 90d / all-time / custom)
- **Statistics block**: avg, min, max, reading count, crisis count, category distribution
- **SVG BP trend chart** embedded in report
- **Optional PP/MAP section**
- **Doctor notes** inclusion
- **Medical disclaimer** footer
- Share sheet integration; file saved to device documents

---

## 11. User Profile & Personal Info

- **Name**, date of birth (age calculation), gender
- **Height**: cm or feet+inches with unit conversion
- **Weight**: kg or lbs with unit conversion
- **BMI calculation** and category (underweight / normal / overweight / obese)
- **Profile badges** shown on Home and Analytics (age, BMI category)

---

## 12. Lifestyle Tags

- **Predefined tags**: sleep, stress, exercise, alcohol, caffeine, salt, hydration, illness
- **Custom tag creation** and deletion
- **Tag selector modal** with multi-select and animation
- **Tag correlation analysis**: Pearson coefficient between tag frequency and BP values

---

## 13. Settings

### SettingsPage (Main Hub)
- **Navigation hub** with menu items for all sub-settings pages
- **Profile summary** — displays user name, age, BMI category
- **Section organization**: Personal Info, Classification, App Settings, Data & Sync, Weather, Family Sharing

### Settings Options

| Setting | Options | Location |
|---|---|---|
| Theme | Light / Dark / System | AppSettingsPage |
| Language | English / Turkish / Serbian / Indonesian | AppSettingsPage |
| Senior Mode | On / Off (1.4× font scaling) | AppSettingsPage |
| High Contrast | On / Off (enhanced contrast for senior mode) | AppSettingsPage |
| Entry Mode Preference | Quick Log / Guided / Not Set | AppSettingsPage |
| Voice Logging | Enable / Disable | AppSettingsPage |
| BP Guideline | AHA/ACC / ESC/ESH / JSH / WHO | ClassificationPage |
| BP Unit | mmHg (only option) | ClassificationPage |
| Region Detection | Button to auto-detect | ClassificationPage |
| Name | Text input | PersonalInfoPage |
| Date of Birth | Date picker | PersonalInfoPage |
| Gender | Male / Female / Not specified | PersonalInfoPage |
| Height | Value + unit (cm or feet+inches) | PersonalInfoPage |
| Weight | Value + unit (kg or lbs) | PersonalInfoPage |
| Default Location | Left Arm / Right Arm / Wrist | PersonalInfoPage |
| Default Posture | Sitting / Lying / Standing | PersonalInfoPage |
| Health Platform Sync | Sync button (Apple Health / Health Connect) | SyncPage |
| Weather Correlation | Enable / Disable (opt-in) | WeatherSettingsPage |
| Weather Location Mode | GPS / City Search | WeatherSettingsPage |
| Weather City | City search + autocomplete | WeatherSettingsPage |
| Temperature Unit | °C / °F | WeatherSettingsPage |
| Family Sharing | Manage relationships, invite, revoke | SharingSettingsPage |

---

## 14. Native Integrations

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

## 15. Family Sharing

### Authentication System
- **Firebase Auth** with multiple sign-in methods:
  - Google Sign-In (iOS + Android)
  - Sign in with Apple (iOS only)
  - Email/password authentication
- **AuthGate component** — wraps Firebase-dependent features with authentication check
- **Offline-first architecture** — app boots fully from local SQLite; Firebase features activate only after sign-in
- **Safe Firebase wrapper** — `getFirebaseUser()` never crashes if Firebase isn't initialized

### Encryption & Security
- **Master key**: AES-256-GCM, generated per user, stored in iOS Keychain / Android Keystore
- **Master key backup**: encrypted with user-password-derived key before Firestore storage
- **Read keys**: HKDF-derived per linked user, never transmitted in plaintext
- **Field-level encryption**: systolic, diastolic, pulse, weight, notes, tags encrypted with AES-256-GCM
- **Plaintext fields**: timestamp, location, posture (needed for Firestore queries)
- **Key rotation**: not yet implemented (planned)

### Pairing & Relationship Management
- **InvitePage** — generate invite code (6-char alphanumeric) + QR code deep link
- **Invite expiry**: 24 hours from creation
- **AcceptInvitePage** — scan QR or enter code to link accounts
- **SharingSettingsPage** — manage all linked relationships:
  - View linked persons with display names
  - Per-relationship sharing config (weight, notes, medications, tags, crisis alerts) — individually toggleable
  - Revoke relationship (with confirmation)
  - Account deletion (revokes all relationships, deletes Firestore data, clears Keychain, deletes auth account)

### Sync System
- **useUploadRecord** — fire-and-forget upload on BP save (never blocks save)
- **useDownloadRecords** — triggered on app foreground + auth state change
- **Retry queue** — failed uploads queued with max 10 retries, persisted via AsyncStorage (upload-queue.test.ts)
- **Conflict resolution** — last-writer-wins by `updatedAt` timestamp (sync-conflict.test.ts)
- **Soft-delete propagation** — deletion propagates across linked accounts
- **SyncManager** — gated behind auth state, only mounts when user is signed in
- **Download batch processing** — fetches records where `updatedAt > lastSyncedAt` per linked user
- **Firestore structure**: `/users/{uid}/records/{recordId}`

### Crisis Alerts
- **useCrisisAlert** — fire-and-forget call to Cloud Function on crisis reading save
- **FCM push notifications** via Cloud Function (`sendCrisisAlert`)
- **Privacy-preserving payload** — BP values omitted from notification, only sender name included
- **Server-side validation** — Cloud Function re-validates crisis threshold (SBP >= 180 OR DBP >= 120)
- **User opt-in** — per-relationship toggle for crisis alerts

### UI Integration
- **Owner filter** on History page — filter by "My Readings" or linked person's name
- **Linked user display names** — stored in local `linked_users` SQLite table, populated from Firestore
- **Relationship status indicators** — pending / active / revoked (via RELATIONSHIP_STATUS constants)
- **Revocation listener** — Firestore snapshot listener cleans up local records + read keys on revocation

---

## 16. App Architecture & Infrastructure

- **FSD (Feature-Sliced Design)** layered architecture
- **Offline-first**: no external API calls on startup; Firebase features activate only after user authentication
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

## 17. UI Components (Shared)

### Core Input Components
| Component | Description |
|---|---|
| `<Numpad />` | Custom numeric input for BP/weight entry — supports auto-advance mode |
| `<DateTimePicker />` | Date and time selection with platform-specific pickers |

### Button System
| Component | Description |
|---|---|
| `<Button />` | Base button with variants: `primary`, `secondary`, `ghost`, `destructive`, `icon`, `fab`, `link` |
| `<ButtonText />` | Text child component for Button |
| `<ButtonIcon />` | Icon child component for Button |
| `<ButtonSpinner />` | Loading spinner child component for Button |
| `<ButtonGroup />` | Grouped button layout for related actions |
| `<SaveButton />` | Contextual save button with loading state and icon |
| `<OptionChip />` | Filter/toggle chip buttons with selected state |

### Card System
| Component | Description |
|---|---|
| `<Card />` | Base card with variants: `elevated`, `outline`, `ghost`, `filled`, `pressable`, `gradient` |
| `<CardHeader />` | Card header child component |
| `<CardBody />` | Card body child component |
| `<CardFooter />` | Card footer child component |
| `<CardDivider />` | Divider line for cards |
| `<StatCard />` | Specialized card for statistics display |
| `<ListCard />` | Specialized card for list items with press action |
| `<CollapsibleCard />` | Animated collapsible/expandable card |

### Charts & Data Visualization
| Component | Description |
|---|---|
| `<BPTrendChart />` | Systolic/diastolic area chart with BP category zone bands |
| `<LineChart />` | Generic line chart component |
| `<DonutChart />` | Time-in-range donut chart visualization |
| `<CircadianBreakdownBars />` | Horizontal bar chart for circadian window data |

### Modals & Overlays
| Component | Description |
|---|---|
| `<CrisisModal />` | High-BP crisis warning modal with emergency guidance |
| `<DerivedMetricsModal />` | PP/MAP explanation modal with medical info |
| `<Toast />` | Floating notification messages (success/error/info) |

### Specialized Components
| Component | Description |
|---|---|
| `<BreathingGuide />` | Animated 4-7-8 breathing technique guide (inhale/hold/exhale phases) |
| `<PageHeader />` | Dynamic page header with time-of-day greeting + variants (home, analytics) |
| `<TagChip />` | Lifestyle tag chip with icon and label |
| `<TagSelector />` | Animated multi-select tag modal |
| `<TagPickerModal />` | Full-screen tag picker with search and custom tag creation |

### Widget Components (Complex UI Blocks)
| Component | Description |
|---|---|
| `<BPRecordCard />` | Full BP record display card with all metadata |
| `<BPRecordsList />` | FlashList-based history list with time grouping |
| `<BPEntryForm />` | Complete BP entry form with numpad and metadata fields |
| `<CircadianCard />` | Circadian analysis card with donut chart and breakdown bars |
| `<CorrelationCard />` | Lifestyle tag correlation results card |
| `<WeatherCorrelationCard />` | Weather factor correlation results card |
| `<TodayScheduleCard />` | Today's medication schedule with adherence tracking |

---

## 18. Test Coverage

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
| Weather Correlations | `entities/weather/__tests__/compute-weather-correlations.test.ts` |
| Weather Client | `shared/api/__tests__/weather-client.test.ts` |
| Medication Correlations | `entities/medication/__tests__/correlations.test.ts` |
| Voice Query Parser | `shared/lib/voice-query-parser.test.ts` |

**Total: 280 tests, 30 suites (verified 2026-04-03)**

### Additional Test Files (Not Listed Above)
- `voice-query-parser.test.ts` — 8 tests for natural language BP query parsing
- `encryption.test.ts` — 12 tests for AES-256-GCM encryption/decryption
- `sync-conflict.test.ts` — 8 tests for last-writer-wins conflict resolution
- `upload-queue.test.ts` — 10 tests for Firebase upload retry queue
- `invite-code.test.ts` — 6 tests for pairing invite code generation/validation
