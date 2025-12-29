---
title: 'TODO: Add hasChanged Instruction'
priority: Medium
effort: 1-2 days
created: 2025-12-19
status: Completed
completed: 2025-12-19
---

# TODO: Add hasChanged Instruction

## Problem Description

The compiler lacks a dedicated instruction to detect value changes between successive evaluations in modules, forcing callers to
manually compare against stored state. This is inconsistent with existing edge helpers (`risingEdge`, `fallingEdge`) and makes
change detection harder to express in `if` blocks. The absence slows authoring and leads to duplicated patterns.

## Proposed Solution

Introduce a `hasChanged` instruction compiler that mirrors the module-only, stack-validated pattern used by `risingEdge` and
`fallingEdge`. It should accept both int and float operands and emit strict raw equality checks against a per-line stored value,
returning `1` when the value differs and `0` otherwise. Register the instruction, add editor highlighting, and cover it with
tests and snapshots.

## Implementation Plan

### Step 1: Implement compiler instruction
- Create `packages/compiler/src/instructionCompilers/hasChanged.ts` with module-only validation and stack checks.
- Store previous/current values with line-numbered identifiers to avoid collisions.
- Compare current vs previous using strict equality for both int and float and push `1` on change, `0` otherwise.

### Step 2: Register and surface the instruction
- Add `hasChanged` to `packages/compiler/src/instructionCompilers/index.ts`.
- Add `hasChanged` to editor highlight list in `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts`.

### Step 3: Add tests and snapshots
- Add `packages/compiler/tests/instructions/hasChanged.test.ts` mirroring existing edge instruction tests.
- Update snapshots to cover int and float cases.

### Step 4: Update documentation or instruction lists
- Search for instruction lists that mention `risingEdge`/`fallingEdge` and add `hasChanged` where applicable.

## Success Criteria

- [ ] `hasChanged` compiles for int and float operands with strict equality checks.
- [ ] Compiler and editor recognize the instruction.
- [ ] Tests and snapshots validate the new instruction behavior.

## Affected Components

- `packages/compiler/src/instructionCompilers/hasChanged.ts` - new instruction implementation
- `packages/compiler/src/instructionCompilers/index.ts` - instruction registration
- `packages/compiler/tests/instructions/hasChanged.test.ts` - new test coverage
- `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts` - instruction highlighting

## Risks & Considerations

- **Type handling**: Ensure int vs float comparisons stay in their native types without coercion.
- **State naming**: Per-line state identifiers must remain stable to avoid memory map conflicts.
- **Dependencies**: None.
- **Breaking Changes**: None expected.

## Related Items

- **Blocks**: None.
- **Depends on**: None.
- **Related**: `docs/todos/128-compiler-remainder-nonzero-guard.md`

## References

- None.

## Notes

- Follow the existing `risingEdge`/`fallingEdge` patterns for validation, locals, and state storage.
