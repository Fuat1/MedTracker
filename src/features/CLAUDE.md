# Features Layer Patterns

**Loaded when working in `src/features/`**

## Purpose

Features layer contains **user actions** and **write operations** (mutations, side effects). Features orchestrate business logic from entities and shared utilities.

## Structure

```
src/features/
├── record-bp/               ← Create new BP reading
│   ├── index.ts
│   └── lib/
│       └── use-record-bp.ts
├── export-pdf/              ← Generate PDF reports
│   ├── index.ts
│   └── lib/
│       ├── use-export-pdf.ts
│       ├── generate-report-html.ts
│       ├── generate-bp-chart-svg.ts
│       └── compute-report-stats.ts
└── delete-bp/               ← Delete BP reading
    ├── index.ts
    └── lib/
        └── use-delete-bp.ts
```

## Feature Pattern (MUST Follow)

Every feature SHOULD have:

1. **React Query mutation hook** (`use-[feature-name].ts`)
2. **Business logic functions** (pure functions, testable)
3. **Barrel export** (`index.ts`)

**Example: `features/record-bp/lib/use-record-bp.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/shared/api/db';
import { generateId } from '@/shared/lib/id-utils';
import type { BPRecordInput } from '@/entities/blood-pressure';

export function useRecordBP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BPRecordInput) => {
      const now = Math.floor(Date.now() / 1000);
      const id = generateId();

      await db.execute(
        `INSERT INTO bp_records (id, systolic, diastolic, pulse, timestamp, location, posture, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.systolic,
          input.diastolic,
          input.pulse ?? null,
          input.timestamp ?? now,
          input.location ?? 'left_arm',
          input.posture ?? 'sitting',
          input.notes ?? null,
          now,
          now,
        ]
      );

      return id;
    },
    onSuccess: () => {
      // Invalidate queries to refetch latest data
      queryClient.invalidateQueries({ queryKey: ['bp-records'] });
    },
  });
}
```

## Features vs Entities (MUST Distinguish)

| Aspect | Features | Entities |
|--------|----------|----------|
| **Purpose** | Write operations (mutations) | Read logic, types, pure functions |
| **React Query** | useMutation hooks | useQuery hooks |
| **Side Effects** | ✓ Database writes, API calls | ✗ Pure functions only |
| **Dependencies** | Can import entities + shared | Can import shared only |

**Example**:
- **Entity**: `useBPRecords()` (query hook that reads data)
- **Feature**: `useRecordBP()` (mutation hook that writes data)

## Pure Function Extraction (SHOULD)

Complex business logic SHOULD be extracted as pure functions for testability:

```typescript
// features/export-pdf/lib/compute-report-stats.ts
export function computeReportStats(records: BPRecord[]) {
  if (records.length === 0) {
    return null;
  }

  const totalReadings = records.length;
  const avgSystolic = Math.round(
    records.reduce((sum, r) => sum + r.systolic, 0) / totalReadings
  );
  const avgDiastolic = Math.round(
    records.reduce((sum, r) => sum + r.diastolic, 0) / totalReadings
  );
  const avgPulse = records.filter(r => r.pulse).length > 0
    ? Math.round(
        records.filter(r => r.pulse).reduce((sum, r) => sum + r.pulse!, 0) /
        records.filter(r => r.pulse).length
      )
    : null;

  return { totalReadings, avgSystolic, avgDiastolic, avgPulse };
}
```

**WHY**: Pure functions can be tested in Jest without React Native mocks.

## Testing Features (SHOULD)

- **Unit test** pure functions (e.g., `computeReportStats.test.ts`)
- **Integration test** mutation hooks with mock database

```typescript
// features/record-bp/lib/use-record-bp.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useRecordBP } from './use-record-bp';

test('useRecordBP creates new BP reading', async () => {
  const { result } = renderHook(() => useRecordBP());

  result.current.mutate({
    systolic: 120,
    diastolic: 80,
    pulse: 72,
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

## Common Mistakes (MUST AVOID)

❌ **Putting UI components in features layer** → Move to `widgets/` or `shared/ui`
❌ **Importing from pages/** → Violates FSD dependency flow
❌ **Hardcoding values** → Use entities for business logic, shared/config for constants
❌ **Missing error handling** → Always handle mutation errors with try/catch or onError
