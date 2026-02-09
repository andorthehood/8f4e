---
title: 'TODO: Remove init/loop section distinction from compiler modules'
priority: Medium
effort: 1-2d
created: 2026-02-08
status: Completed
completed: 2026-02-08
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
- Keep the runtime/exported `init` function, but redefine it to memory-default initialization only.
- Do not keep or add an `init` block syntax in module code.
- A future dedicated special block type (outside module code sections) can be introduced for richer one-time setup.

### Agreed Contract

- **Keep runtime API distinction**: `init` and `cycle` remain separate entrypoints.
- **Remove language/compiler section distinction**: no module-level `init` vs `loop` sections in source or compilation pipeline.
- **Declaration defaults remain first-class**: `int foo 10`, `float bar 1.0`, etc. continue to compile into memory default metadata and are applied by `init`.

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

### Step 3: Preserve and clarify memory-default initialization path
- Keep declaration-default parsing for memory declarations (`int`, `float`, buffers) and their `memory.default` metadata.
- Keep generation of the exported `init` routine that applies declaration defaults.
- Ensure `init` no longer depends on module init-section code; it should only perform memory initialization responsibilities for this phase.

### Step 4: Update tests and snapshots to new model
- Update compiler unit tests and snapshots to match the simplified internal model.
- Remove tests that only validate the old section split behavior.
- Keep/add tests proving declaration defaults are still applied through exported `init`.

### Step 5: Prepare clean handoff for future special one-time block type
- Document extension points where the future memory-init block should plug in.
- Avoid reusing old section abstractions when adding the new block type.

## Validation Checkpoints

- `npx nx run compiler:typecheck`
- `npx nx run compiler:test`
- `rg -n "init segment|loop segment|INIT block" packages/compiler/src packages/compiler/tests`

## Success Criteria

- [ ] Compiler no longer uses init/loop section split for module internals.
- [ ] Section-specific helpers and branching tied to that split are removed.
- [ ] Exported `init` remains available and applies declaration defaults (`int foo 10`, `float bar 1.0`, etc.).
- [ ] No `init` block syntax is required or supported in module code for this model.
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
- **Initialization regressions**: declaration defaults must still be applied exactly once when `init` is called.
- **Snapshot churn**: expected and acceptable, but should still be reviewed for unintended semantic changes.
- **Breaking changes**: explicitly accepted for this pre-release phase.

## Related Items

- **Related**: `docs/todos/056-one-time-init-blocks-language-feature.md`
- **Related**: Future TODO for dedicated memory-init special block type (to be created)

## Notes

- This TODO intentionally separates compiler simplification from the new memory-init block implementation.
- The target end state is a simpler core compiler with:
  - no module init/loop section split
  - an exported runtime `init` for declaration-default memory initialization
  - optional future dedicated special block type for richer one-time setup (outside module code sections)
