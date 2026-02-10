# Project Context: MedTracker (Offline-First BP Monitor)

## 1. Role & Persona
You are a **Senior React Native Solutions Architect** specializing in "Bare" workflow development (CLI).
* **Priorities:** Type safety, JSI performance (op-sqlite), manual native linking mastery, and strict medical data validation.
* **Philosophy:** The user owns their data. Local-first storage (SQLite). No backend.
* **Constraint:** strictly adhere to Feature-Sliced Design (FSD).

## 2. Tech Stack & Environment
* **Framework:** React Native CLI (0.76+ with New Architecture enabled).
* **Language:** TypeScript (Strict Mode).
* **Database:** `op-sqlite` (JSI bindings) with SQLCipher encryption.
* **State (Server/DB):** TanStack Query (React Query).
* **State (Client/UI):** Zustand.
* **Styling:** NativeWind (TailwindCSS) + Reanimated.
* **Navigation:** React Navigation 6/7 (Native Stack).
* **Icons:** `react-native-vector-icons`.
* **Filesystem:** `react-native-fs` (for backups).
* **Cloud Auth:** `@react-native-google-signin/google-signin`.

## 3. Architecture: Feature-Sliced Design (FSD)
Do not create a flat `src/components` folder. Adhere to this hierarchy (dependency flows downwards):

1.  **`app/`**: Entry points (`App.tsx`), Navigation Setup, Global Providers.
2.  **`pages/`**: Full screens (e.g., `HomePage`, `HistoryPage`).
3.  **`widgets/`**: Complex UI blocks (e.g., `BPTrendChart`, `EntryForm`).
4.  **`features/`**: User actions (e.g., `record-bp`, `export-csv`). Contains "Write" logic.
5.  **`entities/`**: Domain models (e.g., `blood-pressure`). Contains "Read" logic, Types, and Dumb UI.
6.  **`shared/`**: Reusable infrastructure (e.g., `ui-kit`, `db-client`, `date-utils`).

**Rule:** A layer can only import from layers *below* it.

## 4. Database Schema & Data Integrity
We use `op-sqlite`. All interactions must use parameterized queries to prevent injection.

### SQL Schema
```sql
CREATE TABLE IF NOT EXISTS bp_records (
  id TEXT PRIMARY KEY NOT NULL, -- UUID v4
  systolic INTEGER NOT NULL CHECK(systolic BETWEEN 40 AND 300),
  diastolic INTEGER NOT NULL CHECK(diastolic BETWEEN 30 AND 200),
  pulse INTEGER CHECK(pulse BETWEEN 30 AND 250),
  timestamp INTEGER NOT NULL, -- Unix Epoch
  timezone_offset INTEGER DEFAULT 0,
  location TEXT DEFAULT 'left_arm',
  posture TEXT DEFAULT 'sitting',
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_synced INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_bp_records_timestamp ON bp_records(timestamp DESC);

```

### Validation Rules (Hard Limits)

* **Systolic:** 40 - 300 mmHg.
* **Diastolic:** 30 - 200 mmHg.
* **Pulse:** 30 - 250 BPM.
* **Logic:** `Systolic` must be > `Diastolic`.

## 5. UI/UX Guidelines

* **Input:** NEVER use standard `TextInput` with the system keyboard for BP entry. Use the custom `Numpad` component (located in `shared/ui`).
* **Accessibility:** All touch targets ≥ 48x48dp.
* **Classification Guidelines:** The app supports multiple official international guidelines (selectable in settings). Default is 2025 AHA/ACC.

### Blood Pressure Classification (Official Guidelines)

#### AHA/ACC (2025) - USA Standard [Default]
Based on 2025 American Heart Association / American College of Cardiology Guidelines
* **Normal:** Green (<120 AND <80 mmHg)
* **Elevated:** Yellow (120-129 AND <80 mmHg)
* **Stage 1 Hypertension:** Orange (130-139 OR 80-89 mmHg)
* **Stage 2 Hypertension:** Red (≥140 OR ≥90 mmHg)
* **Hypertensive Crisis:** Flashing Red/Modal (≥180 OR ≥120 mmHg)
* **Treatment Goal:** <130/80 mmHg for all adults

#### WHO (2021) - International Standard
World Health Organization Guidelines
* **Normal:** Green (<130 AND <85 mmHg)
* **Elevated (High Normal):** Yellow (130-139 OR 85-89 mmHg)
* **Stage 1 Hypertension:** Orange (140-159 OR 90-99 mmHg)
* **Stage 2 Hypertension:** Red (160-179 OR 100-109 mmHg)
* **Hypertensive Crisis:** Flashing Red/Modal (≥180 OR ≥110 mmHg)
* **Treatment Goal:** <140/90 mmHg (general), <130 systolic (with CVD)

#### ESC/ESH (2024) - European Standard
European Society of Cardiology / European Society of Hypertension
* **Normal:** Green (<130 AND <85 mmHg)
* **Elevated (High Normal):** Yellow (130-139 AND <85 mmHg)
* **Stage 1 Hypertension:** Orange (140-159 OR 90-99 mmHg)
* **Stage 2 Hypertension:** Red (160-179 OR 100-109 mmHg)
* **Hypertensive Crisis:** Flashing Red/Modal (≥180 OR ≥110 mmHg)

#### JSH - Japanese Standard
Japanese Society of Hypertension Guidelines
* **Normal:** Green (<130 AND <85 mmHg)
* **Elevated (High Normal):** Yellow (130-139 AND <85 mmHg)
* **Stage 1 Hypertension:** Orange (140-159 OR 90-99 mmHg)
* **Stage 2 Hypertension:** Red (160-179 OR 100-109 mmHg)
* **Hypertensive Crisis:** Flashing Red/Modal (≥180 OR ≥110 mmHg)

**Important Notes:**
- Hypertensive Crisis (≥180/120 for AHA/ACC, ≥180/110 for others) requires immediate medical attention
- Crisis with symptoms = Emergency (call 911/emergency services)
- Crisis without symptoms = Urgency (contact healthcare provider immediately)
- App should display prominent warning and guidance for crisis readings



## 6. Implementation Patterns

### A. Database Access

Initialize DB in `shared/api/db.ts`.

```typescript
// Example: Safe Insertion with op-sqlite
const insertReading = async (reading: BPReading) => {
  try {
    await db.execute(
      `INSERT INTO bp_records (id, systolic, diastolic, ...) VALUES (?, ?, ?, ...)`,
      [reading.id, reading.systolic, reading.diastolic, ...]
    );
  } catch (e) {
    console.error("DB Write Error", e);
  }
};

```

### B. Cloud Backup (Direct REST API)

**Do not use Google Drive SDKs.** Use `fetch` with `Multipart/Related`.

1. **Auth:** Get Access Token via `GoogleSignin`.
2. **File Access:** Use `react-native-fs` (`RNFS.readFile(path, 'base64')` or stream) to read the `.db` file.
3. **Upload:**
* Part 1: JSON Metadata (`parents: ['appDataFolder']`).
* Part 2: Binary stream (`application/octet-stream`).



### C. Native Module Management

* Ensure `Podfile` (iOS) and `build.gradle` (Android) are updated when adding new libs.
* Run `pod install` inside `ios/` after every `npm install`.

## 7. Internationalization (i18n)

### Language Support
MedTracker supports multiple languages for global accessibility:
* **English (en)** - Default
* **Indonesian (id)** - Bahasa Indonesia
* **Serbian (sr)** - Српски
* **Turkish (tr)** - Türkçe

### Translation Structure (FSD-Aligned)
All translations are organized by namespace in `src/shared/config/locales/[lang-code]/`:

```
src/shared/config/locales/
├── en/
│   ├── common.json       # Shared UI (buttons, units, time, navigation)
│   ├── validation.json   # Error messages and validation feedback
│   ├── medical.json      # BP categories, guidelines, medical terms
│   ├── pages.json        # Page-specific content (Home, History, Settings)
│   └── widgets.json      # Widget-specific content (forms, cards, lists)
├── id/ (same structure)
├── sr/ (same structure)
└── tr/ (same structure)
```

### Technical Implementation

**Library:** `i18next` + `react-i18next` (industry standard for React/React Native)

**Configuration:** Located in `src/shared/lib/i18n.ts`
- Namespace-based resource organization
- Fallback to English for missing translations
- Integrated with AsyncStorage via settings store
- Type-safe translation keys via `src/shared/lib/i18n-types.ts`

**Language Persistence:**
- Stored in `settings-store` (Zustand + AsyncStorage)
- Synced automatically with i18next via `setLanguage()` action
- Persists across app restarts

### Usage Patterns

#### In React Components (UI Layer)
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common'); // Specify namespace
  return <Text>{t('buttons.save')}</Text>;
}

// Multiple namespaces
function ComplexComponent() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');

  return (
    <>
      <Text>{t('home.title')}</Text>
      <Text>{tCommon('buttons.done')}</Text>
    </>
  );
}
```

#### In Business Logic (Non-React Code)
```typescript
import i18n from '../shared/lib/i18n';

// Validation errors in entities/blood-pressure/lib.ts
const errorMessage = i18n.t('validation:errors.systolicRange', {
  min: 40,
  max: 300,
});
```

#### With Interpolation
```typescript
// In component:
t('validation:errors.pulseRange', { min: 30, max: 250 })

// In JSON:
"pulseRange": "Pulse must be between {{min}} and {{max}}"
```

#### With Pluralization
```typescript
// In component:
t('pages:history.recordCount', { count: 5 })

// In JSON:
"recordCount_one": "{{count}} reading recorded",
"recordCount_other": "{{count}} readings recorded"
```

**Note:** i18next automatically selects the correct plural form based on language rules.

### Medical Translation Guidelines
**CRITICAL:** Medical terminology must be accurate and verified. Lives depend on correct information.

1. **BP Category Names**: Use official medical terminology in target language
   - Consult official medical guidelines in target language
   - Example: "Hypertensive Crisis" must convey the same urgency in all languages

2. **Crisis Warnings**: Maintain urgency and clarity
   - "Seek immediate medical attention" must be unambiguous
   - Include symptoms: chest pain, shortness of breath, severe headache

3. **Guideline Names**: Keep proper nouns unchanged
   - AHA/ACC, ESC/ESH, JSH, WHO remain as-is
   - Only translate descriptions and regions

4. **Units**: Medical abbreviations are universal
   - mmHg, kPa, BPM remain unchanged
   - Standard worldwide medical terminology

5. **Number Formats**: Consider locale conventions
   - Use locale-appropriate separators where culturally expected
   - Medical standard is period (120.5), but respect local practices

### Translation Resources
For accurate medical translations:
- Use official medical glossaries for each language
- Consult WHO/AHA publications in target languages
- Verify with native speakers who have medical knowledge
- Reference official guidelines in target language
- Prioritize medical accuracy over literal translation

### Type Safety
All translation keys are type-checked at compile-time via TypeScript:

```typescript
// src/shared/lib/i18n-types.ts provides autocomplete and type checking
t('common:buttons.save')     // ✓ Valid
t('common:buttons.invalid')  // ✗ TypeScript error
```

This prevents typos and ensures all translation keys exist.

### Adding New Languages

1. Create new folder: `src/shared/config/locales/[lang-code]/`
2. Copy all JSON files from `en/` folder as templates
3. Translate content (preserve interpolation variables like `{{count}}`)
4. Add language to `src/shared/lib/i18n.ts` resources:
```typescript
import commonNEW from '../config/locales/new/common.json';
// ... import all namespaces

// In i18n.init()
resources: {
  // ... existing languages
  new: {
    common: commonNEW,
    validation: validationNEW,
    medical: medicalNEW,
    pages: pagesNEW,
    widgets: widgetsNEW,
  },
}
```
5. Add language option to Settings page (`src/pages/settings/ui/SettingsPage.tsx`):
```typescript
const languageOptions = [
  // ... existing languages
  { code: 'new', name: 'Language Name', nativeName: 'Native Name' },
];
```
6. Update Language type in settings-store:
```typescript
export type Language = 'en' | 'id' | 'sr' | 'tr' | 'new';
```

### Performance Considerations
- **Bundle Size:** ~10-15KB (all 4 languages, minified + gzipped) - negligible
- **Translation Lookup:** O(1) - instant
- **Language Switch:** ~50-100ms one-time operation
- **Memory:** ~100-150KB in runtime - acceptable for medical app

### Best Practices
1. **Always use `t()` for user-facing strings** - never hardcode text
2. **Use appropriate namespace** - keeps translations organized
3. **Preserve interpolation variables** - `{{count}}`, `{{min}}`, `{{max}}`
4. **Test pluralization** - especially for languages with complex plural rules (Serbian)
5. **Verify medical accuracy** - consult with medical professionals
6. **Handle missing translations** - fallback to English is automatic
7. **Keep medical abbreviations unchanged** - mmHg, BPM are universal
8. **Only add translations to English (`en/`) JSON files** - other languages (tr, id, sr) will be translated separately later. Do NOT add or modify non-English locale files when adding new translation keys.

## 8. Workflow Checklist for AI Generation

Before generating code, verify:

1. [ ] Are we using **React Native CLI** (not Expo)?
2. [ ] Are we using **React Navigation** (Stack/Tabs)?
3. [ ] Are we using `react-native-fs` for file handling?
4. [ ] Is the input validated against official medical guidelines (AHA/ACC 2025, WHO 2021, etc.)?
5. [ ] Are we avoiding the native OS keyboard?

```

### Critical "Gotcha" with CLI & Mac/Windows setup:
Since you are using the CLI, you will need to manually manage the CocoaPods on the Mac.
* **Every time you install a library** (like `npm install react-native-fs`), you **MUST** SSH into the Mac, go to the `ios` folder, and run `pod install`. If you don't do this, the Windows build (or Mac build) will crash because the native code wasn't linked.

```

## 9. Official Medical Guidelines References

All blood pressure classifications in this app are based on peer-reviewed, official medical guidelines:

### Primary Sources:
* **2025 AHA/ACC Guidelines**: [Circulation Journal](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001356)
  - Published January 2025
  - Most recent US clinical practice guidelines
  - Maintains 130/80 threshold from 2017 revision

* **WHO Guidelines (2021)**: [WHO Official Publication](https://www.who.int/publications/i/item/9789240033986)
  - World Health Organization
  - International standard for hypertension diagnosis and treatment
  - Used globally, especially in resource-limited settings

* **ESC/ESH Guidelines (2024)**: European Society of Cardiology
  - Updated 2024 European clinical guidelines
  - Uses 140/90 diagnostic threshold

* **Hypertensive Crisis Definition**: [NCBI/StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK507701/)
  - ≥180/120 mmHg (AHA/ACC)
  - ≥180/110 mmHg (ESC/WHO)
  - Emergency vs. Urgency distinction based on end-organ damage

**Last Updated:** February 2026
**Next Review:** Check for updated guidelines annually

## 10. Navigation Architecture & UI Framework (February 2026)

### Navigation Structure

**Layered Navigation Pattern** (`src/app/navigation/index.tsx`):
```typescript
// Stack wraps Tabs (enables modal screens)
<Stack.Navigator>
  <Stack.Screen name="Main" component={TabNavigator} />
  <Stack.Screen name="NewReading" component={NewReadingPage}
    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
</Stack.Navigator>

// Tab Navigator with custom bar
<Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
  <Tab.Screen name="Home" component={HomePage} />
  <Tab.Screen name="History" component={HistoryPage} />
  <Tab.Screen name="Analytics" component={AnalyticsPage} />
  <Tab.Screen name="Settings" component={SettingsPage} />
</Tab.Navigator>
```

**Why This Pattern?**
- Tabs provide primary navigation (always accessible)
- Stack enables full-screen modals (NewReading, future screens)
- Custom tab bar allows centered FAB without native tab bar limitations

### Custom Tab Bar (`src/app/navigation/CustomTabBar.tsx`)

**Features:**
- 4 tabs: Home, History, Analytics, Settings (split 2-2 with gap)
- Centered FAB (+) button positioned absolutely at `top: -26` (overlaps tab bar)
- Theme-aware colors via `useTheme()`
- Icons from `react-native-vector-icons/Ionicons` (active/inactive states)
- Touch target ≥ 48dp for accessibility

**FAB Pattern:**
```typescript
// FAB navigates to modal, not showing modal directly
<TouchableOpacity onPress={() => stackNav.navigate('NewReading')} />
```

**Important:** FAB logic moved from CustomTabBar to navigation layer—keeps navigation logic separate from UI rendering.

### Design System for UI Components

**Key Dependencies:**
- `react-native-linear-gradient` — Gradient cards (HomePage BP reading display)
- `react-native-svg` — Custom SVG charts (LineChart, future analytics)
- `react-native-reanimated` — Spring animations (Numpad keypresses, screen transitions)
- `react-native-vector-icons/Ionicons` — Consistent icon system

**HomePage Design Pattern:**

1. **Gradient Card** (BP Reading Display):
   ```typescript
   <LinearGradient
     colors={[colors.gradientStart, colors.gradientEnd]} // Theme-aware
     start={{ x: 0, y: 0 }}
     end={{ x: 1, y: 1 }}
     style={styles.card}
   >
     {/* Large BP value, category, pulse badge */}
   </LinearGradient>
   ```
   - Light mode: Teal gradient (#5CBDA5 → #7FCFBC)
   - Dark mode: Same gradient (readable on dark background)
   - Overlays decorative circle for depth

2. **Custom SVG Line Chart** (7-Day Trend):
   ```typescript
   // src/shared/ui/LineChart.tsx
   export function LineChart({ data, width, height, emptyText }) {
     // Auto-scales Y axis based on data min/max
     // Renders systolic line with dots and labels
     // Falls back to empty state with emoji
   }
   ```
   - No heavy charting libraries
   - Manual SVG path calculation for performance
   - Responsive to width prop
   - Theme colors via `useTheme()`

3. **Time-Based Greeting**:
   ```typescript
   function getGreetingKey() {
     const hour = new Date().getHours();
     if (hour < 12) return 'home.greeting.morning';
     if (hour < 18) return 'home.greeting.afternoon';
     return 'home.greeting.evening';
   }
   ```

4. **"Encrypted & Offline" Badge**:
   - Info icon + text in white pill on homepage
   - Reassures user of data privacy
   - Theme: Always contrasts against background

**AnalyticsPage Pattern:**
- Full analytics dashboard with BP Trend Chart, Weekly Average, AM/PM comparison, and PDF export button
- `BPTrendChart` (shared/ui) — custom SVG chart with colored zone backgrounds and dual systolic/diastolic lines
- `computeWeeklyAverage()` and `computeAmPmComparison()` — pure utility functions in shared/lib
- Data sourced via `useBPRecords(30)` from features layer
- Themed with `useTheme()` for dark mode support

## 11. Dark Mode & Theme System (February 2026)

### Architecture: Theme-First Approach

Dark mode is implemented using a **token-based theme system** with Zustand persistence. No context provider needed—theme hook is available everywhere.

#### Core Files:

1. **`src/shared/config/theme.ts`** - Central theme definitions
   - `ThemeColors` interface with 20+ token colors
   - `lightColors` object with light mode palette
   - `darkColors` object with dark mode palette
   - `BP_COLORS_LIGHT` and `BP_COLORS_DARK` (brighter for visibility in dark mode)

2. **`src/shared/lib/use-theme.ts`** - Theme hook
   - Reads `theme` from settings store ('light' | 'dark' | 'system')
   - Uses native `useColorScheme()` when set to 'system'
   - Returns `{ colors, isDark }` tuple for easy destructuring

3. **Settings Store** (`src/shared/lib/settings-store.ts`)
   - Added `theme: ThemeMode` property (defaults to 'system')
   - Added `setTheme(theme: ThemeMode)` action
   - Persisted via AsyncStorage in medtracker-settings key

#### Best Practices:

- **Always use `useTheme()` hook**: All pages, widgets, shared components
- **No hardcoded colors**: Every color comes from `colors` object
- **BP Category Colors**: Use `BP_COLORS_LIGHT/DARK` based on `isDark` for medical visibility
- **Shadows**: Use `colors.shadow` and `colors.shadowOpacity` for adaptive shadows
- **StatusBar**: Automatically switches in `App.tsx` based on theme

#### Themed Components (All Support Dark Mode):

- **Pages**: HomePage, HistoryPage, AnalyticsPage, SettingsPage (with theme toggle)
- **Widgets**: Numpad, LineChart, BPRecordCard, BPRecordsList
- **Navigation**: CustomTabBar with themed FAB button
- **NewReadingPage**: Full page with inline numpad (see below)

### NewReading Page Architecture

**Navigation Structure** (`src/app/navigation/index.tsx`):
- Stack Navigator wraps Tab Navigator
- `NewReading` screen presented as bottom-slide modal
- FAB in CustomTabBar navigates via `stackNav.navigate('NewReading')`

**FSD Structure**:
```
src/pages/new-reading/
├── index.ts
└── ui/NewReadingPage.tsx
```

**Key Features**:

1. **Three Input Boxes** (reuse shared pattern):
   - Systolic | Diastolic | Pulse (side-by-side)
   - Active field highlighted with teal border
   - Tap to activate

2. **Inline Numpad** (shared component):
   - Reuses `<Numpad />` from `shared/ui`
   - Themed with `useTheme()` colors
   - No modal popup—integrated directly

3. **Live BP Classification**:
   - Shows category badge (Normal/Elevated/Stage1/Stage2/Crisis)
   - Uses guideline from settings store
   - Color-coded using `BP_COLORS_LIGHT/DARK`

4. **Validation** (shared logic):
   - Real-time via `validateBPValues()` from `entities/blood-pressure`
   - Error display with validation messages
   - Crisis warning prompt

5. **Dark Mode Support**:
   - All colors from `useTheme()`
   - Proper contrast in both modes

**Component Reuse Pattern** (Key Best Practice):
- `Numpad` shared component (themed)
- `useTheme` hook for colors
- `validateBPValues()` from entities
- `classifyBP()` from entities
- `getBPCategoryLabel()` from entities
- `useRecordBP()` mutation from features
- Settings guideline & defaults from store

**No Duplication**: NewReadingPage focuses only on UI layout and user flow—all logic delegated to shared functions.

### Shared Component Reuse Philosophy (Critical Pattern)

**Principle:** Write logic once in lowest layer, reuse everywhere above.

**Example: BP Entry Logic**
```
entities/blood-pressure/lib.ts
├── classifyBP()           ← Pure logic
├── validateBPValues()     ← Validation
├── getBPCategoryLabel()   ← Lookup
└── getBPCategoryColor()   ← Color mapping

Used by:
├── NewReadingPage (new modal screen)
├── BPEntryForm (legacy modal form)
├── HomePage (display latest)
├── HistoryPage (list display)
└── BPRecordCard (individual card)
```

**Example: Numpad Component**
```
shared/ui/Numpad.tsx
├── Spring animations
├── Haptic feedback
├── Validation (prevent leading zeros)
└── Accessibility labels

Used by:
├── NewReadingPage (inline)
├── BPEntryForm (modal)
└── Future: Any numeric input field
```

**Benefits:**
- ✅ Single source of truth for business logic
- ✅ Consistent behavior across all screens
- ✅ Medical accuracy (validation rules in one place)
- ✅ Easy to test (logic isolated from UI)
- ✅ Easy to refactor (no scattered logic)

### Why Custom SVG Chart Instead of Library?

**Decision:** Build LineChart.tsx with react-native-svg instead of using `react-native-chart-kit` or similar.

**Reasons:**
1. **Bundle size**: Custom SVG << heavy charting library (saves ~200KB)
2. **Theme integration**: Direct access to theme colors, no wrapper colors needed
3. **Simplicity**: Only need one line chart, not full charting suite
4. **Performance**: Native SVG rendering, no canvas overhead
5. **Control**: Easy to customize for medical data display (labels, scaling, etc.)

**Implementation Details** (`src/shared/ui/LineChart.tsx`):
- Manual Y-axis scaling: `(value - min) / range * height`
- SVG path building: Renders line as `<Path>` with `d` prop
- Data points: `<Circle>` elements with labels
- Empty state: Shows `emptyText` when no data
- Responsive: Accepts `width` prop, recalculates on resize

### Design System Colors

**Primary Color:** Medical Teal `#0D9488` (updated February 2026)

**Light Mode Palette** (`src/shared/config/theme.ts`):
```typescript
export const lightColors: ThemeColors = {
  background: '#EDF5F0',      // Mint (HomePage default)
  surface: '#ffffff',          // White cards
  accent: '#0D9488',           // Medical Teal (interactive elements, FAB)
  gradientStart: '#0D9488',    // BP card gradient start
  gradientEnd: '#14B8A6',      // BP card gradient end
  chartLine: '#0D9488',        // Chart systolic line
  chartLineDiastolic: '#5EEAD4', // Chart diastolic line (lighter teal)
  chartZoneNormal: '#dcfce7',  // Green zone background
  chartZoneElevated: '#fef9c3', // Yellow zone background
  chartZoneHigh: '#fecaca',    // Red zone background
  error: '#dc2626',            // Red for errors/crisis
  textPrimary: '#1a1a2e',      // Dark text
  textSecondary: '#64748b',    // Gray text
  // ... 10+ more tokens
};
```

**Dark Mode Enhancements:**
- Surfaces: `#1e293b` (Slate-800 cards) instead of white
- Backgrounds: `#0f172a` (Slate-900)
- Accent: `#14B8A6` (brighter teal for dark backgrounds)
- **BP Category Colors Brightened**: `#4ade80` (green) instead of `#22c55e` for visibility
- **Chart Zone Colors Darkened**: `#14532d`, `#422006`, `#450a0a` for subtlety
- All text lightened for contrast

**Alert Colors (AHA Standard):**
- Green (`#22c55e` / `#4ade80` dark): Normal
- Yellow (`#eab308` / `#fbbf24` dark): Elevated
- Orange (`#f97316` / `#fb923c` dark): Stage 1 Hypertension
- Red (`#ef4444` / `#f87171` dark): Stage 2 Hypertension
- Deep Red (`#dc2626` / `#ef4444` dark): Hypertensive Crisis

### Translation Structure for UI Components

**Namespace Organization:**
```
common.json          ← Reusable: buttons, units, time, navigation
├── buttons.save, .done, .cancel
├── units.mmhg, .bpm
├── location.leftArm, .rightArm
└── posture.sitting, .standing

pages.json           ← Page-specific
├── home.*
├── history.*
├── analytics.*
├── settings.* (including theme settings)
└── newReading.* (new page translations)

medical.json         ← Medical terms
├── categories.normal, .elevated, .stage1, .stage2, .crisis
├── guidelines.ahaAcc.*, .escEsh.*, .jsh.*, .who.*
└── crisis.*

widgets.json         ← Widget-specific
└── bpEntry.*, bpRecordsList.*, etc.
```

**Key Translations Added (February 2026):**
```json
{
  "pages": {
    "settings": {
      "theme": {
        "title": "Theme",
        "light": { "label": "Light Mode" },
        "dark": { "label": "Dark Mode" },
        "system": { "label": "System Default" }
      }
    },
    "newReading": {
      "title": "New Reading",
      "saveMeasurement": "Save Measurement",
      "saving": "Saving..."
    }
  }
}
```

### Translation Updates

**New Keys in `pages.json`**:
```json
{
  "settings": {
    "theme": {
      "title": "Theme",
      "description": "Choose your preferred color theme",
      "light": { "label": "Light Mode", "description": "..." },
      "dark": { "label": "Dark Mode", "description": "..." },
      "system": { "label": "System Default", "description": "..." }
    }
  },
  "newReading": {
    "title": "New Reading",
    "saveMeasurement": "Save Measurement",
    "saving": "Saving...",
    "alerts": { "error": { "title": "Error", "message": "..." } }
  }
}
```

Updated for all 4 languages: `src/shared/config/locales/[en|id|sr|tr]/pages.json`

## 12. FSD Compliance & Architecture Checkpoints

### Layer Dependencies (Enforced Pattern)

```
app/           — Entry, Navigation, Providers
    ↓
pages/         — Full screens only (use widgets + entities + shared)
    ↓
widgets/       — Complex UI blocks (use entities + shared, NOT pages)
    ↓
features/      — User actions, mutations (use entities + shared)
    ↓
entities/      — Domain logic, types (use shared only)
    ↓
shared/        — Utilities, components, config (no upper-layer imports)
```

**Critical Rule:** A layer can ONLY import from layers BELOW it.

### Architecture Audit Checklist

When adding new features, verify:

1. **Navigation** (`src/app/navigation/`)
   - [ ] Uses Stack + Tabs pattern for modals
   - [ ] CustomTabBar in `app/` (not `shared/`) because it imports widgets
   - [ ] New modal screens added to Stack, not Tab direct

2. **Pages** (`src/pages/[feature]/ui/`)
   - [ ] Full screen components only (no reusable UI blocks here)
   - [ ] Uses `useTheme()` for colors
   - [ ] Imports widgets for complex sections
   - [ ] Has barrel export in `src/pages/[feature]/index.ts`

3. **Widgets** (`src/widgets/[feature]/ui/`)
   - [ ] Complex, reusable UI blocks (forms, cards, lists)
   - [ ] Can import entities and shared, NOT pages
   - [ ] Themed with `useTheme()` colors
   - [ ] Has barrel export in `src/widgets/[feature]/index.ts`

4. **Entities** (`src/entities/[domain]/`)
   - [ ] Pure business logic (validation, classification, types)
   - [ ] No React components (UI-less)
   - [ ] Used by pages, widgets, and features
   - [ ] Exported via barrel in `src/entities/[domain]/index.ts`

5. **Shared** (`src/shared/`)
   - [ ] UI components (Numpad, LineChart) with NO business logic
   - [ ] Utilities (date-utils, id generation)
   - [ ] Config (theme tokens, medical settings)
   - [ ] Hooks (useTheme, useSettings)

### Real-World FSD Examples from MedTracker

**Example 1: BP Entry Flow (Correct)**
```
NewReadingPage (page)
├── imports: Numpad (shared/ui) ✓
├── imports: useTheme (shared/lib) ✓
├── imports: validateBPValues (entities) ✓
├── imports: useRecordBP (features) ✓
└── Does NOT import: BPEntryForm (widget) ✓

BPEntryForm (widget)
├── imports: Numpad (shared/ui) ✓
├── imports: useTheme (shared/lib) ✓
├── imports: validateBPValues (entities) ✓
├── imports: useRecordBP (features) ✓
└── Does NOT import: HomePage (page) ✓
```

**Example 2: Theme Implementation (Correct)**
```
HomePage (page)
├── imports: useTheme (shared/lib) ✓

CustomTabBar (app/navigation)
├── imports: useTheme (shared/lib) ✓

use-theme.ts (shared/lib)
├── imports: useSettingsStore (shared/lib) ✓
├── imports: theme.ts (shared/config) ✓
└── Does NOT import: HomePage ✓

theme.ts (shared/config)
├── Defines colors only (no imports) ✓
```

**Example 3: Wrong Pattern (Anti-Pattern)**
```
// ❌ WRONG: shared imports page
shared/ui/MyComponent.tsx
└── imports: HomePage ← BREAKS FSD

// ❌ WRONG: entities imports widget
entities/blood-pressure/lib.ts
└── imports: BPRecordCard ← BREAKS FSD

// ❌ WRONG: widget imports another widget
widgets/bp-entry-form/
└── imports: widgets/bp-record-card ← Use entity instead

// ✓ CORRECT:
widgets/bp-entry-form/
└── imports: entities/blood-pressure ← Shared logic
```

### Adding New Features: Step-by-Step

**Scenario: Add blood pressure target feature**

1. **Create Entity** (`src/entities/bp-targets/`)
   ```typescript
   // lib.ts - Pure logic
   export function validateBPTarget(systolic, diastolic) { ... }
   export function getBPTargetStatus(reading, target) { ... }
   ```

2. **Create Feature** (`src/features/set-bp-target/`)
   ```typescript
   // Hook for mutation
   export function useSetBPTarget() {
     return useMutation(...)
   }
   ```

3. **Create Widget** (`src/widgets/bp-target-form/`)
   ```typescript
   // Reusable form to set targets
   // Uses entities for logic, features for mutations
   export function BPTargetForm() { ... }
   ```

4. **Create Page** (`src/pages/targets/`)
   ```typescript
   // Full screen for target management
   // Uses the widget, entities, features
   export function TargetsPage() { ... }
   ```

5. **Add Navigation** (`src/app/navigation/`)
   ```typescript
   <Stack.Screen name="Targets" component={TargetsPage} />
   ```

6. **Add Translations** (`src/shared/config/locales/*/pages.json`)
   ```json
   { "targets": { "title": "...", "subtitle": "..." } }
   ```

### Why This Matters

**Benefits of Strict FSD:**
- ✅ **Scalability**: Easy to add features without touching existing code
- ✅ **Testability**: Business logic (entities) is isolated and testable
- ✅ **Reusability**: Widgets and entities shared across pages
- ✅ **Maintainability**: Clear dependency graph, no circular imports
- ✅ **Team Collaboration**: Each person can work on isolated features
- ✅ **Type Safety**: Clear import paths help TypeScript

**Cost of Breaking FSD:**
- ❌ Circular dependencies
- ❌ Components tightly coupled to pages
- ❌ Logic scattered across UI files
- ❌ Duplicate validation/classification code
- ❌ Hard to test business logic
- ❌ Difficult refactoring

Updated for all 4 languages: `src/shared/config/locales/[en|id|sr|tr]/pages.json`

## 13. Typography & Font System (February 2026)

### Nunito Font Family

MedTracker uses **Nunito** — a rounded sans-serif typeface optimized for readability in medical apps.

**Font Files:** `assets/fonts/`
- `Nunito-Regular.ttf` (400)
- `Nunito-Medium.ttf` (500)
- `Nunito-SemiBold.ttf` (600)
- `Nunito-Bold.ttf` (700)
- `Nunito-ExtraBold.ttf` (800)

**FONTS Constant** (`src/shared/config/theme.ts`):
```typescript
export const FONTS = {
  regular: 'Nunito-Regular',      // 400 — body text, descriptions
  medium: 'Nunito-Medium',        // 500 — labels, badges, tab labels
  semiBold: 'Nunito-SemiBold',    // 600 — card titles, section headers
  bold: 'Nunito-Bold',            // 700 — buttons, emphasis
  extraBold: 'Nunito-ExtraBold',  // 800 — page titles, BP values
};
```

**Cross-Platform Rule:** Always use BOTH `fontFamily` and `fontWeight` together:
```typescript
// ✓ CORRECT: Works on both Android and iOS
{ fontFamily: FONTS.bold, fontWeight: '700' }

// ❌ WRONG: fontWeight alone won't select Nunito-Bold on Android
{ fontWeight: '700' }
```

Android uses `fontFamily` to select the correct .ttf file. iOS uses `fontWeight` for rendering. Using both ensures consistent behavior across platforms.

**Font Linking:**
- Config: `react-native.config.js` includes `'./assets/fonts'` in assets array
- iOS: `Info.plist` includes all 5 Nunito entries in `UIAppFonts`
- After adding fonts, run: `npx react-native-asset` and `cd ios && pod install`

**Components Using FONTS** (all updated February 2026):
- Pages: HomePage, HistoryPage, AnalyticsPage, SettingsPage, NewReadingPage
- Widgets: BPRecordCard, BPRecordsList
- Shared UI: Numpad, LineChart, BPTrendChart
- Navigation: CustomTabBar

## 14. Analytics Page Architecture (February 2026)

### Overview

The Analytics page provides BP trend visualization and statistical summaries. It replaces the original "Coming Soon" placeholder.

### FSD Structure
```
src/pages/analytics/
├── index.ts
└── ui/AnalyticsPage.tsx        ← Full page component

src/shared/lib/
├── analytics-utils.ts          ← Pure computation (computeWeeklyAverage, computeAmPmComparison)
└── index.ts                    ← Re-exports analytics utils

src/shared/ui/
├── BPTrendChart.tsx            ← SVG chart with colored zones
└── index.ts                    ← Re-exports BPTrendChart
```

### BPTrendChart Component (`src/shared/ui/BPTrendChart.tsx`)

Custom SVG chart with:
- **Three colored zone backgrounds** (Normal green, Elevated yellow, High red)
- **Dual lines**: Systolic (solid, 2.5px, accent color) + Diastolic (dashed, 2px, lighter teal)
- **Fixed Y-axis range**: 70-180 mmHg
- **Zone thresholds**: 120 (Normal/Elevated) and 140 (Elevated/High) per AHA/ACC
- **Props**: `data`, `width`, `height`, `emptyText`, `zoneLabels`, `legendLabels`
- **Theme-aware**: Uses `useTheme()` for all colors including zone backgrounds

### Analytics Utility Functions (`src/shared/lib/analytics-utils.ts`)

Pure functions (no React dependencies):

1. **`computeWeeklyAverage(records)`**: Filters records from last 7 days, returns mean systolic/diastolic
2. **`computeAmPmComparison(records)`**: Splits records by hour (<12 = AM, >=12 = PM), returns averages for each

### Page Layout
```
SafeAreaView
└── ScrollView
    ├── Header (greeting + "Encrypted & Offline" badge)
    ├── BP Trends Card (BPTrendChart in surface card)
    ├── Stats Row (two side-by-side cards)
    │   ├── Weekly Average (systolic/diastolic + mmHg unit)
    │   └── Morning vs Evening (AM/PM comparison)
    └── Export PDF Button (full-width accent button, placeholder alert)
```

### Translation Keys (analytics namespace in `pages.json`)
```
analytics.title, analytics.bpTrends, analytics.weeklyAverage,
analytics.morningVsEvening, analytics.morning, analytics.evening,
analytics.exportPdf, analytics.exportComingSoon, analytics.noData,
analytics.noDataSubtitle, analytics.legend.systolic, analytics.legend.diastolic,
analytics.zones.normal, analytics.zones.elevated, analytics.zones.high
```

Available in all 4 languages: en, tr, id, sr.