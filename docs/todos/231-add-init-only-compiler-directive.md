---
title: 'TODO: Add init-only compiler directive for module execution'
priority: Medium
effort: 3-5h
created: 2026-02-16
status: Open
completed: null
---

# TODO: Add init-only compiler directive for module execution

## Problem Description

The compiler currently supports `#skipExecution`, which excludes a module from the global `cycle` dispatcher. However, there is no directive that runs a module's executable code exactly once during exported `init`.

Current behavior:
- `#skipExecution` prevents cycle calls
- Memory defaults and memory initialization still run during init
- Module executable bytecode is never run when skipped

Needed behavior:
- A module-scoped directive that executes module code one time in init phase
- The same module must not run in cycle phase

## Proposed Solution

Add a new compiler directive: `#initOnly`.

Agreed semantics:
- `#initOnly` is module-scoped.
- Modules marked with `#initOnly` run module code once during exported `init`.
- Modules marked with `#initOnly` are excluded from exported `cycle`.
- Execution order is: all memory initialization first, then init-only module execution.
- `#skipExecution` and `#initOnly` can both be present in the same module.
- If `#skipExecution` is present, `#initOnly` is ignored for that module.
- Multiple `#initOnly` directives in one module are idempotent.

## Anti-Patterns

- Do not change `#skipExecution` behavior.
- Do not run init-only module code before memory initialization completes.
- Do not throw an error when both `#skipExecution` and `#initOnly` are present.
- Do not introduce function-scope or constants-scope support for `#initOnly`.

## Implementation Plan

### Step 1: Add directive metadata plumbing
- Add a module-level flag to compiler context and compiled module metadata (e.g. `initOnlyExecution`).
- Ensure the flag is persisted from instruction compilation to compiled module output.
- Keep implementation parallel to existing `skipExecutionInCycle` plumbing.

### Step 2: Add `#initOnly` instruction compiler
- Add `packages/compiler/src/instructionCompilers/initOnly.ts`.
- Validate module scope only; throw `COMPILER_DIRECTIVE_INVALID_CONTEXT` outside module blocks.
- Set the new init-only module flag.
- Keep behavior idempotent for repeated directives.
- Register the instruction in `packages/compiler/src/instructionCompilers/index.ts`.

### Step 3: Wire dispatcher behavior
- Update global cycle dispatcher generation to exclude `#initOnly` modules.
- Update global init dispatcher generation to call init-only module cycle functions once, after all memory init calls are emitted.
- Respect precedence rule: if `skipExecutionInCycle` is true, do not call init-only execution.

### Step 4: Add tests
- Add integration test that compiles + instantiates wasm:
  - `init()` changes memory for `#initOnly` module exactly once
  - subsequent `cycle()` calls do not apply additional mutations
- Add tests for:
  - module-scope validation errors
  - idempotent repeated `#initOnly`
  - both directives present (`#skipExecution` wins, `#initOnly` ignored)
- Ensure existing `#skipExecution` tests remain valid and unchanged in meaning.

### Step 5: Update docs
- Extend `packages/compiler/docs/directives.md` with `#initOnly`.
- Document scope, init/cycle behavior, ordering, precedence, and examples.

## Validation Checkpoints

- `npx nx run compiler:test`
- `rg -n \"#initOnly|initOnlyExecution|skipExecutionInCycle\" /Users/andorpolgar/git/8f4e/packages/compiler/src /Users/andorpolgar/git/8f4e/packages/compiler/tests /Users/andorpolgar/git/8f4e/packages/compiler/docs`
- Verify integration test asserts behavior via actual `init` and `cycle` execution, not only metadata flags.

## Success Criteria

- [ ] `#initOnly` is accepted only in module scope
- [ ] `#initOnly` module code runs once during exported `init`
- [ ] `#initOnly` module code does not run during exported `cycle`
- [ ] Execution happens after memory initialization
- [ ] `#skipExecution` + `#initOnly` is allowed and skipExecution precedence is respected
- [ ] Compiler docs and tests cover all agreed semantics

## Affected Components

- `packages/compiler/src/instructionCompilers/index.ts` - Register new directive
- `packages/compiler/src/instructionCompilers/initOnly.ts` - New directive compiler
- `packages/compiler/src/compiler.ts` - Carry context/module metadata
- `packages/compiler/src/index.ts` - Init and cycle dispatcher wiring
- `packages/compiler/src/types.ts` - New flags in context/compiled module types
- `packages/compiler/tests/` - Integration and directive behavior coverage
- `packages/compiler/docs/directives.md` - User-facing directive docs

## Risks & Considerations

- **Risk 1**: Double execution if init-only modules are accidentally still included in cycle.
  - Mitigation: Explicit cycle-dispatch tests and integration runtime assertions.
- **Risk 2**: Incorrect ordering relative to memory initialization.
  - Mitigation: Keep init-only call emission strictly after memory-init call list.
- **Risk 3**: Ambiguous behavior when both directives are present.
  - Mitigation: Encode precedence in dispatcher logic and add dedicated test.
- **Breaking Changes**: None expected; this is additive with explicit precedence rules.

## Related Items

- **Related**: `docs/todos/217-add-first-compiler-directive-skip-module-execution.md` (historical context)
- **Related**: `docs/todos/056-one-time-init-blocks-language-feature.md` (conceptual overlap)

## Notes

- This TODO captures implementation details agreed in discussion on 2026-02-16.
- No compiler code changes have been made yet.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
