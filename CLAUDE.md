# MedTracker - Offline-First BP Monitor

React Native CLI blood pressure tracking app with multi-guideline classification, FSD architecture, SQLCipher encryption, and TypeScript strict mode.

## ⚠️ SAFETY-CRITICAL RULES (MUST FOLLOW)

- **NEVER** generate medical diagnoses or treatment recommendations
- **ALL** BP classification logic MUST reference `docs/bp-classification-guidelines.md` before implementation
- **Input validation is MANDATORY**: Reject SBP<40 or >300, DBP<30 or >200, SBP≤DBP
- **Classification thresholds MUST** be imported from typed constants in `src/shared/config/bp-guidelines.ts` — never hardcode inline
- **ALL** user-facing health information MUST include disclaimers from `docs/medical-disclaimers.md`
- **Changes to classification logic** require explicit human review before commit

## Tech Stack

- **Framework**: React Native CLI 0.76+ (Bare workflow, New Architecture enabled)
- **Language**: TypeScript Strict Mode
- **Database**: op-sqlite (JSI) with SQLCipher encryption
- **State**: TanStack Query (server/DB), Zustand (client/UI)
- **Styling**: NativeWind + Reanimated
- **Navigation**: React Navigation 6/7 (Stack + Tabs)
- **Icons**: react-native-vector-icons/Ionicons

## Architecture: Feature-Sliced Design (FSD)

**Dependency flow (one-way only, top to bottom):**

```
app/       → Entry, Navigation, Providers
pages/     → Full screens (use widgets + features + entities + shared)
widgets/   → Complex UI blocks (use features + entities + shared)
features/  → User actions, mutations (use entities + shared)
entities/  → Domain logic, types (use shared only)
shared/    → Utilities, components, config (no upper-layer imports)
```

**MUST**: A layer can ONLY import from layers below it.

## Critical Commands

```bash
npm run android          # Build Android (requires Metro running)
npm run ios             # Build iOS (requires pod install after npm changes)
npm run lint            # ESLint check
npm run typecheck       # TypeScript check
npm test                # Jest tests
cd ios && pod install   # MUST run after every npm install
```

## Verification Commands (Run These Regularly)

```bash
npx tsc --noEmit --skipLibCheck     # Type check
npx eslint src/ --ext .ts,.tsx      # Lint
npm test                            # Jest tests
npx react-native run-android        # Build Android
npx react-native run-ios            # Build iOS
```

## Universal Patterns (MUST)

- **NEVER use TextInput for BP entry** — use `<Numpad />` from `shared/ui`
- **ALWAYS use `useTheme()` hook** for colors — no hardcoded colors
- **Use BOTH `fontFamily` and `fontWeight`** together (Android compatibility)
- **Parameterized queries ONLY** for database (op-sqlite)
- **ALWAYS use `t()` for user-facing strings** — never hardcode text

## i18n Rules (MUST)

- **Add translations ONLY to English (`en/`) JSON files** — other languages (tr, id, sr) translated separately
- **Preserve interpolation variables** (`{{count}}`, `{{min}}`, `{{max}}`)
- **Medical abbreviations unchanged** — mmHg, BPM are universal

## Reference Documentation

- **BP Classification Guidelines**: `docs/bp-classification-guidelines.md` (4 international systems)
- **Database Schema**: `docs/database-schema.md` (SQL + validation rules)
- **Medical Safety**: See `.claude/rules/safety-rules.md` (always loaded)
- **Architecture Details**: See `.claude/rules/architecture-rules.md` (always loaded)
- **Feature Patterns**: See `src/features/CLAUDE.md` (loaded when working in features/)
- **Entity Patterns**: See `src/entities/CLAUDE.md` (loaded when working in entities/)
- **Shared Utilities**: See `src/shared/CLAUDE.md` (loaded when working in shared/)
- **Project Roadmap**: `docs/roadmap.md` (planning reference, not coding guidance)

## Context Compaction Rules

**When Claude Code compacts context, MUST preserve:**
- Modified file list (what changed this session)
- Current FSD layer being worked on
- Medical validation decisions made
- Test results (pass/fail status)
- TODO items or pending tasks
- Any architectural decisions discussed

**MUST NOT preserve:**
- Exploratory file reads (unless led to changes)
- Conversation pleasantries
- Repetitive type checking output

## When You Make Mistakes

If you violate a rule or make an error, update the relevant CLAUDE.md file (root or subdirectory) with a specific instruction to prevent recurrence. Keep instructions concise and actionable.

**Last Updated**: 2026-02-14
