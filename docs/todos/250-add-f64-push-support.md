---
title: 'TODO: Add float64 push support'
priority: Medium
effort: 2-4d
created: 2026-02-19
status: Open
completed: null
---

# TODO: Add float64 push support

## Problem Description

After introducing allocation support for `float64`, the next critical blocker is moving `float64` values through stack operations, starting with `push`.

Current compiler push paths are effectively `int`/`float32` oriented (`i32.const` / `f32.const`) and memory-type routing does not yet model `float64` pushes.

Without `float64` push support:
- constants cannot be pushed as `f64`,
- references to `float64` memory cannot push correctly typed values,
- and downstream `float64` work (store/load/arithmetic) remains blocked.

## Proposed Solution

Add `float64`-aware push behavior while keeping the existing 4-byte global allocation grid.

Scope for this TODO:
- Add `f64.const` emission support for float64 literals in push contexts.
- Extend push memory routing so `float64` memory reads use `f64.load` where required.
- Ensure push type-tracking metadata can represent `float64` stack values.
- Refactor `push` to use a resolver + opcode-table architecture instead of adding more nested if/else branches.

Out of scope:
- implicit numeric promotion between `float32` and `float64`,
- standalone `store`/`load` instruction migration outside push flow,
- full editor/runtime UI parity.

## Anti-Patterns

- Do not silently change existing `push` float32 behavior.
- Do not infer `float64` pushes from pointer shape alone; use explicit memory type metadata.
- Do not bundle push, store, and arithmetic migrations into one large change.
- Do not grow `push` by appending ad-hoc type-specific if branches.

## Implementation Plan

### Step 1: Introduce push resolver contract
- Create a small push-source resolver that maps parsed argument/context into a normalized descriptor (e.g. source kind, value type, const value, memory address mode).
- Extend stack operand metadata from binary `isInteger` toward explicit value kind (`int32`/`float32`/`float64`) in the push path.
- Outcome: one canonical representation drives push codegen decisions.

### Step 2: Add opcode selection tables
- Add `f64const` utility (and ensure `f64load` helper exists for memory-backed push paths).
- Introduce table-driven opcode selection (const/load) keyed by resolved value type.
- Keep bounds-check/safe-address wrappers shared across types.
- Outcome: new types can be added without branch explosion in `push`.

### Step 3: Add push-focused integration tests
- Add instruction tests with memory-map fixtures containing `float64` values.
- Include mixed layouts (int32/float32/float64) and verify pushed values/types match expected byte addresses.
- Add tests that assert resolver outputs and opcode-table routing for each source/type combination.
- Outcome: confidence that float64 push support does not regress existing push behavior and remains maintainable.

## Validation Checkpoints

- `rg -n "push|f64const|f64load|f64\\.const|f64\\.load" /Users/andorpolgar/git/8f4e/packages/compiler`
- `npx nx run @8f4e/compiler:test -- --run "push|float|memory"`
- Confirm snapshots contain `f64.const`/`f64.load` in float64 push scenarios.
- Confirm `push.ts` complexity does not grow via repeated type branches (resolver/table pattern is present).

## Success Criteria

- [ ] Compiler push flow supports float64 and emits `f64.const`/`f64.load` where appropriate.
- [ ] `float64` memory-backed pushes use correct byte addresses and alignment assumptions.
- [ ] Existing int/float32 push behavior remains unchanged.
- [ ] Tests cover mixed-memory layouts and push regression cases.
- [ ] `push` implementation uses resolver + table-driven opcode selection (no ad-hoc branch growth).

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/wasmUtils/const` - add `f64const` helper.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/wasmUtils/load` - ensure `f64load` helper for memory-backed push.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/push.ts` - float64-aware push routing.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers` (new helper module) - push resolver/opcode mapping utilities.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/types.ts` - stack value typing updates needed by push routing.
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests` - instruction/snapshot coverage.

## Risks & Considerations

- **Risk 1**: Mixed-type confusion between `float32` and `float64` push paths.
  - Mitigation: explicit resolver output + table-driven routing and strict tests.
- **Risk 2**: Alignment regressions when reading from complex layouts.
  - Mitigation: add targeted tests with odd-sized 32-bit regions around 64-bit values.
- **Risk 3**: Refactor churn in a central instruction compiler.
  - Mitigation: preserve behavior with characterization tests before/after resolver extraction.
- **Dependencies**: depends on allocation correctness from TODO 249.
- **Breaking Changes**: none expected if additive.

## Related Items

- **Depends on**: `/Users/andorpolgar/git/8f4e/docs/todos/249-add-float64-allocation-support-on-4-byte-grid.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/146-investigate-index-arithmetic-support.md`

## Notes

- Keep the 4-byte global grid invariant; `f64` support should be layered via element size/alignment, not a global grid migration.
- This TODO intentionally isolates push support first because it unblocks the highest-value stack/type flow with limited blast radius.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
