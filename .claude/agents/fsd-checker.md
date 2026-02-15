# FSD Compliance Agent

**Type**: Background Agent (runs on-demand or via hook)
**Purpose**: Detect Feature-Sliced Design violations in the codebase

## Agent Behavior

This agent performs static analysis to find FSD dependency violations:

### 1. Scan Import Statements

For each TypeScript file in `src/`, extract all import statements and categorize by FSD layer:

```typescript
// Detect layer from file path:
src/app/          → Layer: app
src/pages/        → Layer: pages
src/widgets/      → Layer: widgets
src/features/     → Layer: features
src/entities/     → Layer: entities
src/shared/       → Layer: shared
```

### 2. Validate Dependency Flow

**FSD Rule**: A layer can ONLY import from layers below it in this hierarchy:
```
app (6) → pages (5) → widgets (4) → features (3) → entities (2) → shared (1)
```

**Violation Detection**:
- ❌ `shared` imports from any layer (shared is foundation, imports nothing from FSD layers)
- ❌ `entities` imports from `features`, `widgets`, `pages`, or `app`
- ❌ `features` imports from `widgets`, `pages`, or `app`
- ❌ `widgets` imports from `pages` or `app`
- ❌ `pages` imports from `app`

**Allowed Imports**:
- ✅ Any layer imports from `shared`
- ✅ `app` imports from any layer below
- ✅ `pages` imports from `widgets`, `features`, `entities`, `shared`
- ✅ `widgets` imports from `features`, `entities`, `shared`
- ✅ `features` imports from `entities`, `shared`
- ✅ `entities` imports from `shared` only

### 3. Common Anti-Patterns to Flag

**Pattern 1: Business Logic in Shared**
```typescript
// ❌ BAD: src/shared/lib/bp-utils.ts
export function classifyBP(systolic, diastolic) { ... }

// ✅ GOOD: src/entities/blood-pressure/lib.ts
export function classifyBP(systolic, diastolic) { ... }
```

**Pattern 2: UI Components in Entities**
```typescript
// ❌ BAD: src/entities/blood-pressure/BPCard.tsx
export function BPCard() { ... }

// ✅ GOOD: src/widgets/bp-card/ui/BPCard.tsx
export function BPCard() { ... }
```

**Pattern 3: Direct Database Access in Pages**
```typescript
// ❌ BAD: src/pages/home/ui/HomePage.tsx
const result = await db.execute('SELECT * FROM bp_records');

// ✅ GOOD: src/entities/blood-pressure/use-bp-records.ts
export function useBPRecords() { return useQuery(...) }
```

**Pattern 4: Cross-Widget Imports**
```typescript
// ❌ BAD: src/widgets/bp-entry-form/ui/Form.tsx
import { BPCard } from '@/widgets/bp-card';

// ✅ GOOD: Both widgets import from shared entity
import { classifyBP } from '@/entities/blood-pressure';
```

### 4. Scan Strategy

**Step 1**: Use Glob to find all TypeScript files
```bash
**/*.ts
**/*.tsx
```

**Step 2**: For each file, use Grep to extract import statements
```regex
^import .* from ['"](@/[^'"]+|\.\.?/[^'"]+)['"]
```

**Step 3**: Parse import paths and categorize by layer
```typescript
@/app/         → app
@/pages/       → pages
@/widgets/     → widgets
@/features/    → features
@/entities/    → entities
@/shared/      → shared
```

**Step 4**: Check each import against layer hierarchy rules

### 5. Output Report

```markdown
# FSD Compliance Report

## ✅ COMPLIANT FILES
- src/pages/home/ui/HomePage.tsx (imports: widgets, entities, shared)
- src/entities/blood-pressure/lib.ts (imports: shared only)

## ❌ VIOLATIONS FOUND

### Critical: Upward Import
**File**: src/shared/lib/analytics-utils.ts
**Line**: 3
**Issue**: Shared layer imports from entities layer
**Import**: `import { BPRecord } from '@/entities/blood-pressure';`
**Fix**: Move `computeWeeklyAverage()` to `entities/blood-pressure/lib.ts`

### Warning: Cross-Widget Import
**File**: src/widgets/bp-entry-form/ui/Form.tsx
**Line**: 5
**Issue**: Widget imports another widget
**Import**: `import { BPCard } from '@/widgets/bp-card';`
**Fix**: Extract shared logic to entity layer

## Summary
- Total files scanned: 87
- Compliant: 83
- Violations: 4
- Critical: 2
- Warnings: 2
```

## Integration with Hooks

Suggested hook in `.claude/settings.local.json`:
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "agent",
            "agent": "fsd-checker",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

Run automatically after every coding session ends.

## Performance Considerations

- **Cache results**: Only re-scan modified files (check `CLAUDE_FILE_PATHS` env var)
- **Incremental mode**: If >50 files changed, scan only those files
- **Fast fail**: Stop on first critical violation (optional)

## False Positive Handling

**Exemptions** (legitimate upward imports):
- Test files (`*.test.ts`, `__tests__/`) can import from any layer
- Type-only imports (`import type { ... }`) are allowed (no runtime dependency)
- Mock files (`__mocks__/`) can import from any layer

**Example**:
```typescript
// ✅ ALLOWED: Type-only import doesn't create runtime dependency
import type { BPRecord } from '@/entities/blood-pressure';
```

## Exit Behavior

- If **critical violations** found: Display report and suggest fixes
- If **warnings only**: Display report but don't block work
- If **all compliant**: Silent success (no output unless verbose mode)

## References

- FSD Documentation: https://feature-sliced.design/
- Project FSD Rules: `.claude/rules/architecture-rules.md`
- Layer patterns: `src/*/CLAUDE.md` files
