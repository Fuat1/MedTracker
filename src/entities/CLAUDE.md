# Entities Layer Patterns

**Loaded when working in `src/entities/`**

## Purpose

Entities layer contains **domain models**, **read logic**, **types**, and **pure business functions**. This is the single source of truth for business rules.

## Structure

```
src/entities/
├── blood-pressure/
│   ├── index.ts                    ← Barrel export
│   ├── types.ts                    ← BPRecord, BPRecordInput, BPCategory
│   ├── lib.ts                      ← Pure functions (classifyBP, validateBPValues, calculatePP, calculateMAP)
│   ├── use-bp-records.ts           ← React Query hook (reads from DB)
│   └── use-bp-classification.ts    ← React hook (combines validation + classification)
├── measurement-protocol/
│   ├── index.ts
│   └── lib.ts                      ← MEASUREMENT_CHECKLIST, BREATHING_TECHNIQUE constants
└── user-settings/
    ├── index.ts
    └── types.ts                    ← Settings types (guideline, language, theme)
```

## Entity Pattern (MUST Follow)

Every entity SHOULD have:

1. **TypeScript types** (`types.ts`) - Single source of truth for domain models
2. **Pure business functions** (`lib.ts`) - Classification, validation, calculations (NO React dependencies)
3. **React Query hooks** (`use-[entity]-[action].ts`) - Data fetching with TanStack Query
4. **Barrel export** (`index.ts`) - Re-export all public APIs

## Types (MUST)

Define domain models with strict TypeScript types:

```typescript
// entities/blood-pressure/types.ts
export type BPCategory =
  | 'normal'
  | 'elevated'
  | 'stage_1'
  | 'stage_2'
  | 'crisis';

export interface BPRecord {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: number;              // Unix seconds
  timezone_offset: number;
  location: 'left_arm' | 'right_arm' | 'wrist';
  posture: 'sitting' | 'standing' | 'lying_down';
  notes?: string;
  created_at: number;
  updated_at: number;
  is_synced: boolean;
}

export interface BPRecordInput {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp?: number;             // Defaults to current time
  location?: 'left_arm' | 'right_arm' | 'wrist';
  posture?: 'sitting' | 'standing' | 'lying_down';
  notes?: string;
}
```

## Pure Business Functions (MUST)

All business logic MUST be **pure functions** (no side effects, no React dependencies):

```typescript
// entities/blood-pressure/lib.ts
import i18n from '@/shared/lib/i18n';
import type { BPCategory } from './types';

export function classifyBP(
  systolic: number,
  diastolic: number,
  guideline: 'aha_acc' | 'who' | 'esc_esh' | 'jsh' = 'aha_acc'
): BPCategory {
  // AHA/ACC 2025 guidelines
  if (guideline === 'aha_acc') {
    if (systolic >= 180 || diastolic >= 120) return 'crisis';
    if (systolic >= 140 || diastolic >= 90) return 'stage_2';
    if (systolic >= 130 || diastolic >= 80) return 'stage_1';
    if (systolic >= 120 && diastolic < 80) return 'elevated';
    return 'normal';
  }

  // WHO 2021 / ESC/ESH 2024 / JSH guidelines
  if (systolic >= 180 || diastolic >= 110) return 'crisis';
  if (systolic >= 160 || diastolic >= 100) return 'stage_2';
  if (systolic >= 140 || diastolic >= 90) return 'stage_1';
  if (systolic >= 130 || diastolic >= 85) return 'elevated';
  return 'normal';
}

export function validateBPValues(
  systolic: number,
  diastolic: number,
  pulse?: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (systolic < 40 || systolic > 300) {
    errors.push(i18n.t('validation:errors.systolicRange', { min: 40, max: 300 }));
  }
  if (diastolic < 30 || diastolic > 200) {
    errors.push(i18n.t('validation:errors.diastolicRange', { min: 30, max: 200 }));
  }
  if (pulse !== undefined && (pulse < 30 || pulse > 250)) {
    errors.push(i18n.t('validation:errors.pulseRange', { min: 30, max: 250 }));
  }
  if (systolic <= diastolic) {
    errors.push(i18n.t('validation:errors.systolicMustBeGreater'));
  }

  return { valid: errors.length === 0, errors };
}

export function calculatePulsePressure(systolic: number, diastolic: number): number {
  return systolic - diastolic;
}

export function calculateMAP(systolic: number, diastolic: number): number {
  return Math.round((systolic + 2 * diastolic) / 3);
}
```

**WHY pure functions?**
- ✅ Testable in Jest without React Native mocks
- ✅ Reusable across pages, widgets, features
- ✅ Single source of truth for business logic
- ✅ Easy to maintain and refactor

## React Query Hooks (SHOULD)

For data fetching, use TanStack Query hooks:

```typescript
// entities/blood-pressure/use-bp-records.ts
import { useQuery } from '@tanstack/react-query';
import { db } from '@/shared/api/db';
import type { BPRecord } from './types';

export function useBPRecords(limit?: number) {
  return useQuery({
    queryKey: ['bp-records', limit],
    queryFn: async () => {
      const query = limit
        ? `SELECT * FROM bp_records ORDER BY timestamp DESC LIMIT ?`
        : `SELECT * FROM bp_records ORDER BY timestamp DESC`;

      const result = await db.execute(query, limit ? [limit] : []);
      return result.rows._array as BPRecord[];
    },
  });
}
```

## React Hooks for Combined Logic (SHOULD)

For complex UI logic that combines multiple pure functions, create React hooks:

```typescript
// entities/blood-pressure/use-bp-classification.ts
import { useMemo } from 'react';
import { useSettingsStore } from '@/shared/lib/settings-store';
import { useTheme } from '@/shared/lib/use-theme';
import { BP_COLORS_LIGHT, BP_COLORS_DARK } from '@/shared/config/theme';
import { classifyBP, validateBPValues } from './lib';
import type { BPCategory } from './types';

export function useBPClassification(
  systolic: string,
  diastolic: string,
  pulse?: string
) {
  const guideline = useSettingsStore(state => state.guideline);
  const { isDark } = useTheme();

  const systolicNum = systolic ? parseInt(systolic, 10) : null;
  const diastolicNum = diastolic ? parseInt(diastolic, 10) : null;
  const pulseNum = pulse ? parseInt(pulse, 10) : undefined;

  const validation = useMemo(() => {
    if (systolicNum === null || diastolicNum === null) {
      return { valid: false, errors: [] };
    }
    return validateBPValues(systolicNum, diastolicNum, pulseNum);
  }, [systolicNum, diastolicNum, pulseNum]);

  const category: BPCategory | null = useMemo(() => {
    if (systolicNum === null || diastolicNum === null || !validation.valid) {
      return null;
    }
    return classifyBP(systolicNum, diastolicNum, guideline);
  }, [systolicNum, diastolicNum, guideline, validation.valid]);

  const categoryColor = category
    ? (isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT)[category]
    : null;

  return {
    systolicNum,
    diastolicNum,
    pulseNum,
    validation,
    category,
    categoryColor,
  };
}
```

**WHY in entities, not shared?**
- This hook uses domain-specific logic (`classifyBP`, `validateBPValues`)
- It depends on entities/blood-pressure types and functions
- Placing in shared/ would violate FSD (shared cannot import from entities)

## Entities vs Shared (MUST Distinguish)

| Aspect | Entities | Shared |
|--------|----------|---------|
| **Purpose** | Domain logic, business rules | Generic utilities, infrastructure |
| **Examples** | BP classification, validation | Date formatting, ID generation |
| **Dependencies** | Can import shared only | Imports nothing from upper layers |
| **React Hooks** | Domain-specific hooks (useBPClassification) | Generic hooks (useTheme, useDebounce) |

## Common Mistakes (MUST AVOID)

❌ **Importing from features/** → Violates FSD dependency flow
❌ **UI components in entities/** → Move to `shared/ui` or `widgets/`
❌ **Side effects in pure functions** → Keep functions pure, move side effects to features
❌ **Hardcoded thresholds** → Import from `shared/config/bp-guidelines.ts`
