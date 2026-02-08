---
title: 'TODO: Remove init/loop section distinction from compiler modules'
priority: Medium
effort: 1-2d
created: 2026-02-08
status: Open
completed: null
---

# TODO: Remove init/loop section distinction from compiler modules

## Problem Description

`@8f4e/compiler` currently carries a structural distinction between module initialization and module loop sections. That split was introduced as an intermediate design, but the direction has changed: memory initialization should be represented by a dedicated special block type instead of overloading module structure.

Keeping the current distinction now creates unnecessary complexity in AST/compilation flow and makes the upcoming memory-init block feature harder to design cleanly.

## Proposed Solution

Remove the init/loop section distinction from module compilation internals and treat module code as a single execution body again.

Important context for this TODO:
- Backward compatibility is explicitly not required for this refactor.
- Breaking API/output behavior is acceptable while the app is still pre-release.
- A future dedicated memory-init special block will replace the old conceptual role of init sections.

## Anti-Patterns

- Re-introducing init-vs-loop branching under different names in compiler internals.
- Preserving legacy split behavior "just in case" and carrying dead pathways forward.
- Coupling this refactor to the new memory-init block implementation in one large change.

## Implementation Plan

### Step 1: Remove compiler-internal section split
- Eliminate init/loop segmented storage in compilation context and related helpers.
- Update instruction compilers and validators that rely on init-only scope semantics tied to module sections.
- Keep control-flow `loop` instruction behavior intact (this TODO is about module sectioning, not loop opcodes).

### Step 2: Simplify compile pipeline and module/function assembly
- Refactor pipeline stages that currently merge/route init and loop segments.
- Ensure generated module functions are assembled from a single body flow for module execution.
- Remove no-longer-needed branching and dead code paths.

### Step 3: Update tests and snapshots to new model
- Update compiler unit tests and snapshots to match the simplified internal model.
- Remove tests that only validate the old section split behavior.
- Keep or add tests that protect required semantics for module execution and memory ops.

### Step 4: Prepare clean handoff for future memory-init special block
- Document extension points where the future memory-init block should plug in.
- Avoid reusing old section abstractions when adding the new block type.

## Validation Checkpoints

- `npx nx run compiler:typecheck`
- `npx nx run compiler:test`
- `rg -n "init segment|loop segment|INIT block" packages/compiler/src packages/compiler/tests`

## Success Criteria

- [ ] Compiler no longer uses init/loop section split for module internals.
- [ ] Section-specific helpers and branching tied to that split are removed.
- [ ] Compiler tests/typecheck pass after snapshot/test updates.
- [ ] Codebase is ready for a separate dedicated memory-init special block feature.

## Affected Components

- `packages/compiler/src/utils/compilation.ts` - remove segmented compilation helpers
- `packages/compiler/src/instructionCompilers/*` - adjust compilers/validation that assume section split
- `packages/compiler/src/withValidation.ts` - revisit scope rules tied to init sectioning
- `packages/compiler/src/index.ts` - simplify compile assembly flow
- `packages/compiler/tests/**/*` - update tests/snapshots to the new internal model
- `packages/compiler/docs/instructions/program-structure-and-functions.md` - follow-up doc alignment

## Risks & Considerations

- **Behavior drift**: removing the split can accidentally alter execution ordering; mitigate with focused instruction-level and integration tests.
- **Scope validation regressions**: old init-only validation rules may become stale and must be revised.
- **Snapshot churn**: expected and acceptable, but should still be reviewed for unintended semantic changes.
- **Breaking changes**: explicitly accepted for this pre-release phase.

## Related Items

- **Related**: `docs/todos/056-one-time-init-blocks-language-feature.md`
- **Related**: Future TODO for dedicated memory-init special block type (to be created)

## Notes

- This TODO intentionally separates compiler simplification from the new memory-init block implementation.
- The target end state is a simpler core compiler with explicit specialized blocks for one-time memory setup.
