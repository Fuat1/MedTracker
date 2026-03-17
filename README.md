# MedTracker

MedTracker is a React Native blood pressure and medication tracking application built with a focus on an **Offline-First** architecture, comprehensive clinical guidelines (AHA/ACC, ESC/ESH, WHO, JSH), and a senior-friendly design surface.

## 🚀 Tech Stack
- **Framework:** React Native CLI (Bare workflow, New Architecture enabled)
- **Language:** TypeScript (Strict Mode)
- **Database:** `op-sqlite` (JSI-based) with SQLCipher encryption
- **State Management:** Zustand (Client state), TanStack Query (Database mutations & caching)
- **UI:** NativeWind (TailwindCSS) + React Native Reanimated
- **Charts:** `react-native-gifted-charts`

## 🏗 Architecture
This project strictly follows **Feature-Sliced Design (FSD)**:

- `src/app/`: Entry points, navigation configuration, and app-wide providers.
- `src/pages/`: High-level screens representing navigable routes.
- `src/widgets/`: Independent, complex UI blocks combining multiple features (e.g., `TodayScheduleCard`).
- `src/features/`: User-driven actions and TanStack Query mutations (e.g., `useRecordBP`).
- `src/entities/`: Domain logic, models, pure functions, and shared types (e.g., BP classification engines).
- `src/shared/`: UI primitives (buttons, layout), configs, theme hooks, and localization (`i18next`).

*Rule: An upper layer can import from a lower layer, but lower layers NEVER import from an upper layer.*

## 🛠 Setup & Commands

### Prerequisites
- Node.js >= 20
- Ruby (for CocoaPods on macOS)
- Java 17 (for Android)

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Install iOS Pods (macOS only)
cd ios && pod install && cd ..

# 3. Start Metro Bundler
npm run start

# 4. Run on Platform
npm run ios
# or
npm run android
```

### Essential Quality Scripts
```bash
npm run typecheck    # Run TypeScript compiler
npm run lint         # Check ESLint rules
npm test             # Run Jest test suites
```

## 🔒 Privacy & Security
MedTracker uses SQLCipher to encrypt the local SQLite database. By default, the app is 100% offline and requests no outbound network connections for analytics or tracking. Synchronizations (Apple Health, Health Connect) are rigorously opt-in.
