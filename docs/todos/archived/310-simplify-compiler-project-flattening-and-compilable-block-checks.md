---
title: 'TODO: Simplify compiler project flattening and compilable block checks'
priority: Medium
effort: 1-3h
created: 2026-03-14
status: Completed
completed: '2026-03-30'
---

# TODO: Simplify compiler project flattening and compilable block checks

## Problem Description

The editor compiler effect currently does more array work and duplicated block-type checks than necessary during project flattening and recompile triggering.

Current behavior:
- [packages/editor/packages/editor-state/src/features/program-compiler/effect.ts](packages/editor/packages/editor-state/src/features/program-compiler/effect.ts) builds `allBlocks` with one `filter` and one `sort`
- `flattenProjectForCompiler(...)` then runs three more `filter` passes to derive `modules`, `functions`, and `macros`
- the effect repeats the same “is this a compilable block type?” ladder in two separate subscriptions

Why this is a problem:
- the logic is more verbose than needed in a hot edit/recompile path
- repeated block-type predicates create easy drift if a new compilable type is added later
- the current shape hides the actual rule set behind duplicated condition chains

Impact:
- small but real repeated work on every relevant edit
- medium maintainability benefit from centralizing the compilable-type rule
- easier future changes when new block types are added or renamed

## Proposed Solution

Refactor the compiler effect so project flattening is more direct and compilable block-type checks are centralized.

High-level approach:
- replace the three post-sort filters with a single partition pass over the sorted enabled blocks
- add one helper such as `isCompilableBlockType(blockType)` used both in flattening and in the edit subscriptions
- keep the public compiler callback inputs unchanged

Possible implementation shape:
- sort once, then push each block into `modules`, `functions`, or `macros` in one loop
- treat `constants` as part of `modules` exactly as today
- use one shared helper for `module`, `function`, `constants`, and `macro`

## Anti-Patterns

- Do not change which block types are compiled as part of this cleanup.
- Do not add memoization or caching unless profiling shows a clear need.
- Do not couple this refactor to broader compiler scheduling changes.

## Implementation Plan

### Step 1: Extract the compilable-type helper
- Add one small helper for the accepted compiler block types
- Reuse it anywhere the effect currently repeats the same block-type ladder

### Step 2: Flatten in one pass
- Keep the enabled-block filter and creation-index sort
- Partition sorted blocks into `modules`, `functions`, and `macros` in one loop

### Step 3: Update subscriptions
- Replace repeated inline block-type checks in selected-block subscriptions
- Keep current disabled-block behavior intact

### Step 4: Add focused tests
- Verify flattening still preserves order
- Verify `constants` remain in `modules`
- Verify non-compilable block types still do not trigger recompilation

## Validation Checkpoints

- `rg -n "flattenProjectForCompiler|blockType !==|blockType === 'module'|blockType === 'macro'" packages/editor/packages/editor-state/src/features/program-compiler`
- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`

## Success Criteria

- [ ] `flattenProjectForCompiler(...)` partitions sorted enabled blocks in a single pass.
- [ ] Compilable block-type checks are centralized in one helper.
- [ ] Recompile triggers preserve current behavior for disabled and non-compilable blocks.
- [ ] Tests still cover ordering and block-type handling.

## Affected Components

- `packages/editor/packages/editor-state/src/features/program-compiler/effect.ts` - flattening and subscription logic
- `packages/editor/packages/editor-state/src/features/program-compiler` tests - verify unchanged behavior

## Risks & Considerations

- **Behavior drift**: `constants` blocks must remain part of `modules`.
- **Over-optimization**: the goal is to remove obvious repeated work and duplication, not to redesign compiler scheduling.
- **Test coverage**: existing tests may not explicitly pin all current block-type trigger rules.

## Related Items

- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`

## Notes

- This is a small internal cleanup in a path that runs frequently during editing.
- The main value is keeping the block-type rule in one place while trimming repeated array passes.
