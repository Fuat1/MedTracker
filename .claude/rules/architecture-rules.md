# FSD Architecture Rules (Always Active)

## Layer Dependencies (MUST)

```
app/       → can import: pages, widgets, features, entities, shared
pages/     → can import: widgets, features, entities, shared
widgets/   → can import: features, entities, shared
features/  → can import: entities, shared
entities/  → can import: shared ONLY
shared/    → imports NOTHING from upper layers
```

**CRITICAL**: Violating this hierarchy breaks the architecture. If you need to use page logic in a widget, extract it to an entity or feature first.

## Common FSD Violations (MUST NOT)

- ❌ `shared/ui` importing from `pages/` or `widgets/`
- ❌ `entities/` importing from `features/`
- ❌ `widgets/` importing other `widgets/` (extract shared logic to `entities/` or `shared/`)
- ❌ Business logic in `shared/` (move to `entities/`)
- ❌ UI components in `entities/` (move to `shared/ui` or `widgets/`)

## Barrel Exports (SHOULD)

Every FSD module SHOULD have an `index.ts` barrel export:

```typescript
// src/entities/blood-pressure/index.ts
export * from './lib';
export * from './types';
```

## File Naming (SHOULD)

- **Pages**: `HomePage.tsx`, `SettingsPage.tsx` (PascalCase + Page suffix)
- **Widgets**: `BPTrendChart.tsx`, `BPEntryForm.tsx` (PascalCase, descriptive)
- **Hooks**: `use-theme.ts`, `use-bp-input.ts` (kebab-case, use- prefix)
- **Utils**: `analytics-utils.ts`, `date-utils.ts` (kebab-case, -utils suffix)
- **Types**: `types.ts` or inline with implementation

## Component Reuse Pattern (SHOULD)

When creating similar features (e.g., NewReadingPage and QuickLogPage):

1. Extract shared logic to hooks in `shared/lib` (e.g., `useBPInput`)
2. Extract business logic to `entities/` (e.g., `useBPClassification`)
3. Extract shared UI to `shared/ui` (e.g., `<Numpad />`, `<SaveButton />`)
4. Pages focus ONLY on layout and user flow

## Navigation Structure (MUST)

```typescript
// Stack wraps Tabs (enables modals)
<Stack.Navigator>
  <Stack.Screen name="Main" component={TabNavigator} />
  <Stack.Screen name="NewReading" component={NewReadingPage}
    options={{ presentation: 'modal' }} />
</Stack.Navigator>

// CustomTabBar in app/navigation (NOT shared/)
<Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
  {/* ... tabs */}
</Tab.Navigator>
```

**WHY**: CustomTabBar is in `app/` because it imports widgets. Shared components MUST NOT import from upper layers.
