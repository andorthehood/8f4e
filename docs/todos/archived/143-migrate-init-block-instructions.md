---
title: 'TODO: Migrate Init Block Instructions to withValidation'
priority: Medium
effort: 1-2h
created: 2025-12-20
status: Completed
completed: 2025-12-20
---

# TODO: Migrate Init Block Instructions to withValidation

## Problem Description

Two initialization block instruction compilers (`initBlock`, `initBlockEnd`) need migration to the `withValidation` helper pattern. This TODO includes these 2 instructions plus time for a final review of all migrations.

## Proposed Solution

Refactor these init block instruction compilers to use the `withValidation` helper where applicable, then perform a comprehensive review of all migrated instructions.

## Implementation Plan

### Step 1: Migrate `initBlock` instruction
- Evaluate validation needs
- Wrap with appropriate scope validation
- Preserve init block logic
- Verify tests pass

### Step 2: Migrate `initBlockEnd` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 3: Comprehensive review
- Review all 63 migrated instruction compilers
- Ensure consistency in validation patterns
- Verify all tests pass
- Check code coverage hasn't decreased

### Step 4: Documentation update
- Update any relevant documentation
- Mark TODO #130 as completed
- Archive completed migration TODOs

### Step 5: Final validation
- Run full test suite
- Run linting and type checking
- Verify no performance regressions

## Success Criteria

- [x] All remaining instructions use `withValidation` wrapper where applicable
- [x] All 266+ tests pass without modification
- [x] Code coverage maintained or improved
- [x] Type checking passes
- [x] Linting passes
- [x] Documentation updated

## Affected Components

- `packages/compiler/src/instructionCompilers/initBlock.ts`
- `packages/compiler/src/instructionCompilers/initBlockEnd.ts`
- All previously migrated instruction compilers (for review)

## Risks & Considerations

- **Risk**: Final review may uncover inconsistencies
- **Mitigation**: Address any issues found during review
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Depends on**: TODOs #131-#142 (all previous migration batches)
- **Completes**: The full instruction compiler migration initiative

## Notes

- This is the final TODO in the migration series
- After completion, all instruction compilers will use consistent validation patterns
- Consider updating TODO #130 to reflect completion status

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move this and all related migration TODOs (#131-#143) to the `archived/` folder
3. Update TODO #130 status to reflect that the helper is now fully adopted

## Completion Notes

**Completed on**: 2025-12-20

**Summary**: Successfully migrated both `initBlock` and `initBlockEnd` instruction compilers to use the `withValidation` helper pattern.

**Changes Made**:
1. Migrated `initBlock` to use `withValidation` with `scope: 'module'`
2. Migrated `initBlockEnd` to use `withValidation` with `scope: 'module'`
3. Removed manual scope validation in favor of the helper
4. Verified all 266 tests pass
5. Confirmed type checking and linting pass

**Review Results**:
- 62 out of 66 instruction compilers now use `withValidation`
- 4 instructions intentionally don't use it: `const`, `use`, `wasm`, `module`, and `function`
- These have valid reasons (no scope requirements, or they create scopes rather than operate within them)
- All migrations follow consistent patterns with appropriate validation specs
