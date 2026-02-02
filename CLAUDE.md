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
* **Color Logic (AHA Guidelines):**
* **Normal:** Green (<120/<80)
* **Elevated:** Yellow (120-129/<80)
* **Stage 1:** Orange (130-139 or 80-89)
* **Stage 2:** Red (≥140 or ≥90)
* **Crisis:** Flashing Red/Modal (>180 and/or >120)



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

## 7. Workflow Checklist for AI Generation

Before generating code, verify:

1. [ ] Are we using **React Native CLI** (not Expo)?
2. [ ] Are we using **React Navigation** (Stack/Tabs)?
3. [ ] Are we using `react-native-fs` for file handling?
4. [ ] Is the input validated against JNC8/AHA limits?
5. [ ] Are we avoiding the native OS keyboard?

```

### Critical "Gotcha" with CLI & Mac/Windows setup:
Since you are using the CLI, you will need to manually manage the CocoaPods on the Mac.
* **Every time you install a library** (like `npm install react-native-fs`), you **MUST** SSH into the Mac, go to the `ios` folder, and run `pod install`. If you don't do this, the Windows build (or Mac build) will crash because the native code wasn't linked.

```