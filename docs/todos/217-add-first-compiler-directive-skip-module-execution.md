---
title: 'TODO: Add first compiler directive to skip module execution in cycle'
priority: Medium
effort: 4-6h
created: 2026-02-09
status: Open
completed: null
---

# TODO: Add first compiler directive to skip module execution in cycle

## Problem Description

We want the first compiler directive to disable runtime execution for specific modules while preserving normal compilation and memory initialization behavior.

Current compiler behavior always includes every compiled module in the generated cycle dispatcher function. This means every module executes each cycle, even when a module should be logically disabled.

## Proposed Solution

Introduce a module-scoped compiler directive (hash-prefixed, after TODO 216 is complete) that marks a module as non-executing in the cycle dispatcher.

Required semantics:
- Module is still compiled normally (AST, memory map, inter-module references preserved).
- Module memory defaults and init behavior still run in init/memory-init path.
- Module cycle function is not called from the global cycle dispatcher.

Suggested directive spelling for v1:
- `#skipExecution`

Placement:
- Allowed anywhere within a module block.

## Implementation Plan

### Step 1: Parse directive and attach module metadata
- Add compiler directive pre-pass on AST/module compilation input.
- Detect `#skipExecution` in module scope and store metadata flag on compiled module output (for example `skipExecutionInCycle: boolean`).
- Ignore duplicate `#skipExecution` directives (idempotent behavior).
- Fail fast on unknown hash directives with line-numbered compiler directive errors.
- Fail fast with compiler directive errors when module-only directives are used outside module blocks.

### Step 2: Exclude flagged modules from cycle dispatcher
- In `packages/compiler/src/index.ts`, when building the global cycle function call list, filter out modules marked `skipExecutionInCycle`.
- Keep memory initiator function generation unchanged for those modules.
- Keep module compilation order/memory layout unchanged.

### Step 3: Tests and docs
- Add compiler tests verifying:
  - flagged module is omitted from global cycle calls
  - flagged module memory initialization still occurs
  - inter-module memory refs to flagged module still resolve
  - unknown directives produce clear errors
- Document the directive in compiler instruction/directive docs.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "skipExecutionInCycle|skipExecution|directive" packages/compiler/src packages/compiler/tests`

## Success Criteria

- [ ] A module can be marked to skip cycle execution via compiler directive.
- [ ] Flagged modules are omitted from the generated global cycle dispatcher.
- [ ] Memory initialization for flagged modules still runs correctly.
- [ ] Memory addresses and inter-module references remain stable.
- [ ] Unknown directives fail with dedicated compiler directive errors.
- [ ] Module-only directive usage outside modules fails with dedicated compiler directive errors.

## Affected Components

- `packages/compiler/src/index.ts` - cycle dispatcher assembly.
- `packages/compiler/src/compiler.ts` - directive pre-pass integration.
- `packages/compiler/src/types.ts` - optional module metadata flag.
- `packages/compiler/src/syntax/*` - directive tokenization/classification as needed.
- `packages/compiler/tests/**` - execution omission + memory-init coverage.
- `packages/compiler/docs/**` - directive documentation.

## Risks & Considerations

- **Ordering dependency**: this should land after TODO 216 so `#` is no longer generic comment syntax.
- **Line-number mapping**: directive handling must preserve original line numbers for errors.
- **Feature interaction**: ensure constants blocks/functions ignore module-only directives cleanly.
- **Compatibility**: pre-release allows introducing directive without migration shim.

## Ambiguities To Resolve

- Resolved:
  - `#skipExecution` is allowed anywhere inside module blocks.
  - Duplicate `#skipExecution` directives are accepted (idempotent).
  - `#skipExecution` is module-only and invalid in `constants`/`function` scopes.
  - Unknown/invalid directive usage must use dedicated compiler directive error codes.

## Related Items

- **Depends on / Related**: `docs/todos/216-stop-treating-hash-as-compiler-comment.md`
- **Related**: `docs/todos/215-migrate-editor-directives-to-semicolon-comments.md`

## Notes

- This TODO intentionally skips broader directive infrastructure and focuses on the first concrete directive end-to-end.
