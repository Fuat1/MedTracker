# MedTracker Strategic Roadmap (2026-2027)

**Planning reference only** - Not loaded into AI coding sessions.

## Current Status: Category A Digital Logger ✅

- Robust manual entry interface (Numpad-based)
- Platform integration (op-sqlite local storage)
- Data visualization (charts, trends, circadian breakdown)
- Clinical reporting (PDF generation, Save to Device)
- Senior-centric design (large fonts, high contrast, auto-advance)
- Pre-measurement guidance (breathing exercises, AHA checklist)
- Derived metrics (PP, MAP with educational modals)
- Circadian analysis (time windows, morning surge detection, time-in-range)
- Lifestyle tagging (7 built-in tags, bottom-sheet picker, correlation insights on Analytics)

## Phase 1: Completed ✅

1. **Senior-Centric Manual Entry** ✅
   - Quick Log Page with 90dp touch targets, auto-advance
   - Date/Time backdating with custom picker
   - Entry mode selection (Quick Log vs Guided Entry)
   - Senior Mode (+20% font scaling, 90x80 numpad buttons)
   - High-Contrast Mode (medical-grade black-on-white)

2. **Pre-Measurement Guidance** ✅
   - 4-step guided workflow (checklist → breathing → timer → ready)
   - AHA 5-step preparation checklist
   - 4-7-8 breathing exercise with Reanimated animation
   - 5-minute rest timer with auto-advance
   - "Remember this choice" entry mode persistence

3. **Clinical Reporting** ✅
   - PDF export with period selector (7d/14d/30d/90d/all/custom)
   - Custom range date pickers
   - Doctor notes (500 char max)
   - SVG chart embedded in PDF
   - Category breakdown table
   - Optional PP/MAP inclusion
   - **Save to Device** (direct download to Downloads/Files app, no share sheet) ✅
   - Full i18n of all PDF report strings ✅

4. **Derived Metrics** ✅
   - Pulse Pressure (PP) calculations and interpretation
   - Mean Arterial Pressure (MAP) calculations and interpretation
   - Educational modals with medical references
   - Optional Analytics chart trend lines
   - Conditional PDF export inclusion

## Phase 2: Advanced Analytics (Q2 2026)

### 2.1 Circadian Analysis ✅

- Auto-sort readings by time window:
  - Morning (6-10am), Day (10am-6pm), Evening (6pm-10pm), Night (10pm-6am)
- Morning surge detection (rapid AM increases = stroke risk) + toast notification
- Time-in-range visualization (% readings within target per guideline)
- Circadian breakdown bars on Analytics page

**Implemented FSD Structure**:
```
src/entities/circadian-pattern/lib.ts          ← Time window logic, surge detection
src/shared/lib/circadian-utils.ts              ← Pure time window calculations
src/widgets/circadian-card/ui/CircadianCard.tsx ← Analytics page card
```

### 2.2 Lifestyle Tagging ✅

- Optional tags per reading: Salt, Stress, Alcohol, Exercise, Medication, Caffeine, Poor Sleep
- Tag entry UI ✅ — compact pill button next to date picker on QuickLog + NewReading, opens bottom-sheet multi-select modal
- Tags saved with BP record via `useRecordBP` mutation ✅
- Tags displayed on BPRecordCard ✅ — icon-only in compact/History view, labeled chips in full view
- Correlation insights on Analytics page ✅ — "Your readings are X mmHg higher on salt days" (requires ≥3 tagged + ≥3 untagged readings)
- Privacy-first: All analysis local (no cloud AI)
- Tags stored in `bp_tags` table — **migration + repository done** ✅ (see `docs/database-schema.md`)

**Planned Enhancement: Custom Tags**
- Allow users to create their own tags beyond the 7 built-in ones
- Custom tag: user-defined label + icon picker (from Ionicons subset)
- Stored in `custom_tags` table; merged into tag picker modal
- Scope: free-form labels useful for personal patterns (e.g. "coffee", "gym", "travel")

**FSD Structure**:
```
src/entities/lifestyle-tag/                    ← Tag types, LIFESTYLE_TAGS metadata, correlations ✅
src/shared/ui/TagChip.tsx                      ← Toggleable chip component ✅
src/widgets/tag-selector/ui/TagPickerModal.tsx ← Bottom-sheet multi-select ✅
src/widgets/correlation-card/ui/CorrelationCard.tsx ← Analytics insights display ✅
src/features/manage-tags/                      ← TanStack Query hooks (useTagsForRecords etc.) ✅
```

## Phase 3: Platform Integration (Q3 2026)

### 3.1 Apple Health / Health Connect Sync
- **Read**: Import BP readings from connected devices (Omron, Withings)
- **Write**: Export MedTracker readings to platform health stores
- **Bidirectional sync**: Merge data without duplicates (timestamp-based)
- Privacy: User controls what syncs (opt-in per direction)

**Tech Stack**:
- iOS: HealthKit API
- Android: Health Connect API
- Conflict resolution: Latest timestamp wins
- Native modules: `react-native-health` or custom bridge

### 3.2 Medication Tracking
- Medication inventory (name, dosage, schedule)
- Adherence reminders (local notifications)
- Correlate BP readings with medication timing
- Flag missed doses coinciding with elevated readings

**FSD Structure**:
```
src/entities/medication/                       ← Medication types, schedules
src/features/track-medication/                 ← Add/edit/delete medications
src/widgets/medication-adherence/              ← Adherence calendar view
src/pages/medications/                         ← Medication management page
```

## Phase 4: Next-Generation Features (2027+)

### 4.1 Family Sharing / Remote Monitoring
- **Use Case**: Adult children monitoring elderly parent's BP
- **Architecture**: End-to-end encrypted sync via Firebase/Supabase
- **Privacy**: Explicit consent required, revocable anytime
- **Alerts**: Notify family if reading enters Crisis zone (push notifications)

### 4.2 Voice Logging (Siri/Google Assistant)
- **iOS**: Siri Shortcuts integration
- **Android**: Google Assistant App Actions
- **Command**: "Hey Siri, log blood pressure 120 over 80 pulse 72"
- **Validation**: Voice confirmation before saving

### 4.3 Predictive Intelligence (Experimental)
- **Causal AI**: Multi-factor analysis (sleep, diet, stress, weather)
- **Example**: "Your BP is elevated due to insufficient sleep (<6hrs) and high sodium intake yesterday"
- **Regulatory**: Requires FDA clearance for medical claims
- **Privacy**: On-device ML (CoreML, TensorFlow Lite)

### 4.4 Weather Correlation
- **Data Source**: OpenWeather API (optional, user-controlled)
- **Analysis**: Identify patterns between barometric pressure/temperature and BP
- **Display**: "Your BP tends to rise 5 mmHg on cold days (<50°F)"

## What We Will NOT Build

### Cuffless Measurement
**Reason**: No FDA-cleared, calibration-free solution exists (as of 2026). Samsung/Biospectal require cuff calibration. Camera-based PPG methods lack clinical validation.

**Stance**: MedTracker is a **logger**, not a measurement device. We trust users' validated cuffs.

### Subscription Pricing for Core Features
**Philosophy**: Basic logging, charting, and PDF export remain free or one-time purchase. Subscriptions only for cloud sync or premium analytics (if ever).

## Feature Prioritization Tiers

**Tier 1 (Must-Have)**: ✅ All completed
**Tier 2 (High Value)**: ✅ Circadian analysis complete, ✅ Lifestyle tagging complete — Platform sync remaining
**Tier 3 (Nice-to-Have)**: Medication tracking, Custom lifestyle tags, Voice logging
**Tier 4 (Future/Experimental)**: Family sharing, Predictive AI, Weather correlation

**Last Updated**: 2026-02-18
