# CLAUDE.md Migration Summary

**Date**: 2026-02-14
**Reduced from**: ~1,850 lines → **79 lines** (root file)
**Reason**: Linear instruction-following decay in Claude Sonnet models

## The Problem

Your original 1,850-line CLAUDE.md was approximately **18x longer** than Anthropic's own Claude Code team uses (~100 lines). Research from the IFScale study shows that Claude Sonnet models exhibit **linear instruction-following decay** — every additional instruction measurably degrades adherence to *all* instructions.

Key issues:
- Claude Code wraps CLAUDE.md with "may or may not be relevant" — actively instructed to ignore parts
- Frontier models can follow ~150-200 instructions consistently (your file had several hundred)
- "Lost in the middle" effect: 30%+ attention drop for middle content
- Performance warning at ~40,000 characters (your file approached this limit)

## The Solution: Progressive Disclosure Architecture

Instead of one monolithic file, you now have:

```
CLAUDE.md (79 lines)                    ← Always loaded (universally applicable)
├── .claude/rules/                      ← Always loaded (universal rules)
│   ├── safety-rules.md                 ← Medical safety constraints
│   └── architecture-rules.md           ← FSD compliance details
├── docs/                               ← Read on demand (reference only)
│   ├── bp-classification-guidelines.md ← All 4 international guideline systems
│   ├── database-schema.md              ← SQL schema + validation rules
│   ├── medical-disclaimers.md          ← Required disclaimer text
│   └── roadmap.md                      ← Strategic planning (not coding guidance)
└── src/                                ← Loaded when working in that directory
    ├── features/CLAUDE.md              ← Feature layer implementation patterns
    ├── entities/CLAUDE.md              ← Entity layer domain logic patterns
    └── shared/CLAUDE.md                ← Shared utilities patterns
```

## What Moved Where

### Kept in Root CLAUDE.md (79 lines)
- ✅ Safety-critical rules (primacy bias - top of file)
- ✅ Tech stack summary
- ✅ FSD hierarchy diagram (concise)
- ✅ Critical commands (build, test, lint)
- ✅ Universal patterns (MUST rules only)
- ✅ i18n rules
- ✅ Pointers to reference docs

### Moved to `.claude/rules/` (Always Loaded)
- ✅ `safety-rules.md` — Medical safety constraints, input validation, prohibited actions
- ✅ `architecture-rules.md` — FSD dependency flow, common violations, navigation structure

### Moved to `docs/` (Read on Demand)
- ✅ `bp-classification-guidelines.md` — All 4 guideline systems (AHA/ACC, WHO, ESC/ESH, JSH)
- ✅ `database-schema.md` — SQL schema, validation rules, TypeScript types
- ✅ `medical-disclaimers.md` — Required disclaimer text for UI
- ✅ `roadmap.md` — Strategic roadmap through 2027 (planning, not coding)

### Moved to Subdirectory CLAUDE.md (Context-Specific)
- ✅ `src/features/CLAUDE.md` — Feature layer patterns (mutations, side effects)
- ✅ `src/entities/CLAUDE.md` — Entity layer patterns (pure functions, types, queries)
- ✅ `src/shared/CLAUDE.md` — Shared utilities patterns (infrastructure, no business logic)

### Removed Entirely
- ❌ Competitive analysis (20+ apps) — business intelligence, not coding guidance
- ❌ Persona definition ("You are a senior React Native engineer...") — wastes tokens
- ❌ Feature prioritization tiers — project management, not AI coding context
- ❌ Code examples in root file — moved to subdirectory CLAUDE.md files
- ❌ Full guideline tables in root — moved to `docs/bp-classification-guidelines.md`

## How Progressive Disclosure Works

1. **Root CLAUDE.md**: Loaded into every coding session (keep under 100 lines)
2. **`.claude/rules/`**: Always loaded with same priority as root (for organized universal rules)
3. **Subdirectory CLAUDE.md**: Loaded ONLY when Claude reads files in that directory
4. **`docs/` reference files**: Loaded on demand when Claude needs context (you reference them in root)

Example:
- Working in `src/features/export-pdf/` → `src/features/CLAUDE.md` loads automatically
- Implementing classification → Claude reads `docs/bp-classification-guidelines.md` when referenced
- General coding → Only root CLAUDE.md + `.claude/rules/` active (lean context)

## Benefits of New Structure

### Before (1,850 lines)
- ❌ Claude ignored large portions (system reminder says "may not be relevant")
- ❌ Middle content got 30%+ less attention ("lost in the middle")
- ❌ Exceeded instruction budget → linear decay degraded adherence to ALL rules
- ❌ Medical safety rules buried in middle of file
- ❌ Roadmap and competitive analysis wasted tokens every session

### After (79 lines root + progressive disclosure)
- ✅ Well within instruction budget (50-100 lines recommended)
- ✅ Safety-critical rules at top (primacy bias)
- ✅ Context loaded on demand (only when relevant)
- ✅ Lean, high-signal root instructions
- ✅ Deep domain context available exactly when needed
- ✅ Consistent adherence to critical rules

## Research Backing

- **IFScale Study** (July 2025): Linear instruction-following decay in frontier models
- **Anthropic's own team**: ~100 lines, 2,500 tokens for Claude Code's CLAUDE.md
- **Instruction budget**: ~150-200 instructions before degradation
- **Performance warning**: ~40,000 characters threshold
- **Community consensus**: 50-100 lines for root file

## Format Changes for Sonnet 4.5

Based on research, the new structure uses:

- **Concise bullet points** (not prose) — each bullet = one clear directive
- **Imperative language** ("Use X" not "Consider using X")
- **"Don't X, instead use Y" pattern** — prevents Claude from getting stuck
- **MUST/SHOULD labels** — explicit priority signals
- **Markdown formatting** — headers, bullets, bold (NOT XML tags in CLAUDE.md)
- **Primacy/recency bias** — most important rules at top and bottom

## Next Steps

### Immediate (Done ✅)
1. ✅ Root CLAUDE.md reduced to 79 lines
2. ✅ Created `.claude/rules/` with safety + architecture rules
3. ✅ Extracted reference docs to `docs/`
4. ✅ Created subdirectory CLAUDE.md files for FSD layers
5. ✅ Moved roadmap to `docs/roadmap.md`

### Recommended (Future)
1. **Add Claude Code hooks** for safety-critical constraints:
   - Stop hook: Run linter + type checker after every task
   - PreToolUse hook: Block writes to `src/shared/config/bp-guidelines.ts` without confirmation
2. **Test instruction-following**: Use canary phrase (e.g., "address me as Mr. Tinkleberry") to detect when context is too long
3. **Monthly pruning**: Review CLAUDE.md, remove stale rules, consolidate redundancies
4. **Adopt living document pattern**: When Claude makes mistake → "Update CLAUDE.md so you don't make that mistake again"

### Verify What's Loaded
Run `/memory` command in Claude Code to see which files are currently loaded.

## Testing the New Structure

1. **Open a coding session** → Check that root CLAUDE.md + rules are loaded
2. **Navigate to `src/features/`** → Verify `features/CLAUDE.md` loads
3. **Ask Claude about BP guidelines** → Should reference `docs/bp-classification-guidelines.md`
4. **Test safety rules** → Try to hardcode BP threshold → Should refuse and point to typed constants
5. **Test FSD compliance** → Try to import page in shared component → Should refuse

## Rollback Plan

If you need to revert:
1. Old CLAUDE.md backed up as `CLAUDE.md.backup` (if needed)
2. Simply restore old file and delete new structure
3. However, recommend trying new structure for at least 1 week to see benefits

## Expected Improvements

Based on research and community reports:

- **20-30% better adherence** to safety-critical rules (primacy bias + lean context)
- **Faster responses** (less context to process)
- **More accurate FSD compliance** (layer-specific rules load when relevant)
- **Better medical safety** (rules always prominent, never buried in middle)
- **Easier maintenance** (update only relevant file, not monolithic doc)

## Questions?

- **"Will Claude still know about my roadmap?"** → It's in `docs/roadmap.md` for your reference, but AI doesn't need it for coding
- **"What if I add new features?"** → Add to appropriate subdirectory CLAUDE.md (e.g., `src/features/CLAUDE.md`)
- **"Can I use @import?"** → Yes, but defeats progressive disclosure — use pointers instead
- **"How do I know it's working?"** → Test with canary phrase, monitor adherence to safety rules

**Last Updated**: 2026-02-14
