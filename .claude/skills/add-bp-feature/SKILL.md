# Add BP Feature Skill

**Invocation**: `/add-bp-feature <feature-name>` or when user asks to "add a new BP feature" or "scaffold BP functionality"

**Purpose**: Generate FSD-compliant scaffolding for new blood pressure-related features

## Skill Behavior

When invoked with a feature name (e.g., `/add-bp-feature medication-correlation`), this skill creates the complete FSD layer structure:

### Step 1: Clarify Feature Scope
Ask user to confirm:
- **Feature type**: Read operation (entity) or Write operation (feature)?
- **UI needed**: Widget, full page, or both?
- **Database changes**: New table, new columns, or use existing bp_records?
- **Medical safety impact**: Does this affect BP classification or validation?

### Step 2: Create Entity Layer (if read logic needed)
```
src/entities/<feature-name>/
├── index.ts                    # Barrel export
├── types.ts                    # TypeScript interfaces
├── lib.ts                      # Pure business functions
└── use-<feature-name>.ts       # React Query hook (if data fetching)
```

**Template for types.ts**:
```typescript
// entities/<feature-name>/types.ts
export interface <FeatureName>Record {
  id: string;
  // ... domain model fields
  created_at: number;
  updated_at: number;
}

export interface <FeatureName>Input {
  // ... input fields (subset of Record)
}
```

**Template for lib.ts**:
```typescript
// entities/<feature-name>/lib.ts
import type { <FeatureName>Record } from './types';

/**
 * Pure business logic function
 * @param data - Input data
 * @returns Computed result
 */
export function validate<FeatureName>(data: <FeatureName>Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  // ... validation logic
  return { valid: errors.length === 0, errors };
}
```

### Step 3: Create Feature Layer (if write logic needed)
```
src/features/<feature-name>/
├── index.ts
└── lib/
    └── use-<feature-name>.ts   # TanStack Query mutation hook
```

**Template for mutation hook**:
```typescript
// features/<feature-name>/lib/use-<feature-name>.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/shared/api/db';
import type { <FeatureName>Input } from '@/entities/<feature-name>';

export function use<FeatureName>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: <FeatureName>Input) => {
      // ... database write logic with parameterized queries
      await db.execute(
        `INSERT INTO <table> (...) VALUES (?, ?, ...)`,
        [input.field1, input.field2, ...]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['<feature-name>'] });
    },
  });
}
```

### Step 4: Create Widget Layer (if complex UI block needed)
```
src/widgets/<feature-name>/
├── index.ts
└── ui/
    └── <FeatureName>Widget.tsx
```

**Template for widget**:
```typescript
// widgets/<feature-name>/ui/<FeatureName>Widget.tsx
import { View, Text } from 'react-native';
import { useTheme } from '@/shared/lib/use-theme';
import { FONTS } from '@/shared/config/theme';

export function <FeatureName>Widget() {
  const { colors, fontScale } = useTheme();

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ fontFamily: FONTS.semiBold, fontWeight: '600', color: colors.textPrimary }}>
        {/* Widget content */}
      </Text>
    </View>
  );
}
```

### Step 5: Create Page (if full screen needed)
```
src/pages/<feature-name>/
├── index.ts
└── ui/
    └── <FeatureName>Page.tsx
```

**Template for page**:
```typescript
// pages/<feature-name>/ui/<FeatureName>Page.tsx
import { SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '@/shared/lib/use-theme';
import { PageHeader } from '@/widgets/page-header';
import { <FeatureName>Widget } from '@/widgets/<feature-name>';

export function <FeatureName>Page() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
        <PageHeader variant="title" title="<Feature Name>" />
        <<FeatureName>Widget />
      </ScrollView>
    </SafeAreaView>
  );
}
```

### Step 6: Add Navigation Route
Provide code snippet for `src/app/navigation/index.tsx`:
```typescript
// Add to Stack or Tab Navigator:
<Stack.Screen
  name="<FeatureName>"
  component={<FeatureName>Page}
  options={{ title: '<Feature Name>' }}
/>
```

### Step 7: Add i18n Keys
Provide template for `src/shared/config/locales/en/pages.json`:
```json
{
  "<featureName>": {
    "title": "<Feature Name>",
    "subtitle": "Description of feature",
    "buttons": {
      "save": "Save <Feature Name>",
      "cancel": "Cancel"
    },
    "alerts": {
      "success": "<Feature Name> saved successfully",
      "error": {
        "title": "Error",
        "message": "Failed to save. Please try again."
      }
    }
  }
}
```

### Step 8: Medical Safety Check
If feature impacts BP classification or validation:
- ✅ Update `docs/bp-classification-guidelines.md` if thresholds change
- ✅ Add validation rules to `.claude/rules/safety-rules.md`
- ✅ Require medical-review skill before commit
- ✅ Add PreToolUse hook to block changes without approval

## FSD Compliance Checklist

Before completing, verify:
- [ ] No upward imports (entities can't import features, shared can't import entities)
- [ ] Pure functions in entity layer (no React dependencies in lib.ts)
- [ ] Mutations in feature layer (not in entities or shared)
- [ ] UI components use `useTheme()` hook (no hardcoded colors)
- [ ] All user-facing text uses `t()` from i18next (no hardcoded strings)
- [ ] Database queries are parameterized (no string concatenation)
- [ ] TypeScript types exported from entity layer

## Output Format

Generate all files with TODO comments for user customization:
```typescript
// TODO: Implement <specific logic>
// TODO: Add validation for <field>
// TODO: Update with actual <requirement>
```

## Integration with Project

After scaffolding:
1. Run `npx tsc --noEmit --skipLibCheck` to verify TypeScript
2. Run `npx eslint src/ --ext .ts,.tsx` to check linting
3. Suggest next steps (e.g., "Add database migration", "Update tests")

## Exit Behavior

- Provide summary of files created
- List FSD layers used (entity/feature/widget/page)
- Highlight any medical safety considerations
- Suggest running `/medical-review` if classification logic touched
