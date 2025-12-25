---
title: 'TODO: Split Memory Instruction Into int/float With Shared Helpers'
priority: Medium
effort: 4-6 hours
created: 2025-12-25
status: Open
completed: null
---

# TODO: Split Memory Instruction Into int/float With Shared Helpers

## Problem Description

The current `packages/compiler/src/instructionCompilers/memory.ts` handles `int`, `float`, `int*`, `int**`, `float*`, and `float**` in a single compiler. This makes the instruction logic harder to follow and violates the "one file per instruction" rule. Pointer depth handling and argument parsing are intertwined with the instruction implementation, increasing cognitive load when making changes.

## Proposed Solution

Split the current `memory.ts` implementation into `int.ts` and `float.ts` instruction compilers, and move shared logic into helpers under `packages/compiler/src/utils.ts`.

- Keep pointer depth as syntax handled by the instruction compilers (e.g., `int*`, `int**`, `float*`, `float**`).
- Extract argument parsing from `memory.ts` into a shared helper (default values, const lookups, `&` and `$` references, intermodular refs).
- Extract pointer depth handling into a helper to avoid duplicating regex/parsing logic.
- Update the instruction registry to map `int`, `float`, and pointer variants to the appropriate compiler file.
- Split `packages/compiler/src/instructionCompilers/memory.test.ts` into `int.test.ts` and `float.test.ts`.

Alternative considered:
- Keep a single `memory.ts` with internal branching. Rejected due to the "one file per instruction" rule and readability concerns.

## Implementation Plan

### Step 1: Add shared helpers to `packages/compiler/src/utils.ts`
- Add a helper that parses memory instruction arguments and returns `{ id, defaultValue }`.
- Add a helper that derives pointer depth from the instruction string (e.g., `int**` -> `2`).
- Add a helper that derives flags (`isPointer`, `isPointingToInteger`, `isPointingToPointer`, `isInteger`) from base type and pointer depth.

### Step 2: Create `int.ts` and `float.ts` instruction compilers
- Move the core memory declaration logic into each instruction compiler.
- Use the shared helpers for argument parsing and pointer depth handling.
- Preserve the current behavior for memory address calculation, default values, and metadata flags.

### Step 3: Update instruction registry and remove `memory.ts`
- Update `packages/compiler/src/instructionCompilers/index.ts` to point `int` and `int*`/`int**` to `int.ts`, and `float` and `float*`/`float**` to `float.ts`.
- Remove `packages/compiler/src/instructionCompilers/memory.ts` once new compilers are wired.

### Step 4: Split tests for int and float
- Replace `packages/compiler/src/instructionCompilers/memory.test.ts` with `int.test.ts` and `float.test.ts`.
- Ensure both test files cover pointer variants and default-value parsing.

## Success Criteria

- [ ] `int` and `float` memory declarations are handled in separate files.
- [ ] Pointer depth parsing is centralized in a helper under `packages/compiler/src/utils.ts`.
- [ ] Argument parsing logic is shared between `int.ts` and `float.ts`.
- [ ] No behavior changes for existing memory declarations (same defaults, IDs, and metadata flags).

## Affected Components

- `packages/compiler/src/instructionCompilers/int.ts` - new instruction compiler for integer memory.
- `packages/compiler/src/instructionCompilers/float.ts` - new instruction compiler for float memory.
- `packages/compiler/src/instructionCompilers/index.ts` - update instruction mappings.
- `packages/compiler/src/utils.ts` - add shared helpers.
- `packages/compiler/src/instructionCompilers/memory.ts` - remove after migration.
- `packages/compiler/src/instructionCompilers/int.test.ts` - new tests for integer memory instruction.
- `packages/compiler/src/instructionCompilers/float.test.ts` - new tests for float memory instruction.
- `packages/compiler/src/instructionCompilers/memory.test.ts` - remove after migration.

## Risks & Considerations

- **Risk**: Flag semantics might change accidentally (e.g., current `isInteger` behavior for pointer types).
- **Risk**: Instruction mapping may miss pointer variants if not updated.
- **Dependencies**: None, but ensure nested `AGENTS.md` guidance is respected.
- **Breaking Changes**: None expected if behavior is preserved.

## Related Items

- **Blocks**: None
- **Depends on**: None
- **Related**: None

## References

- `packages/compiler/src/instructionCompilers/memory.ts`
- `packages/compiler/src/instructionCompilers/index.ts`
- `packages/compiler/src/utils.ts`

## Notes

- Treat `*` as syntax handled by the instruction compiler; do not introduce separate instruction files for `int*` or `float*`.
- Keep the "one file per instruction" rule as the guiding structure.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
