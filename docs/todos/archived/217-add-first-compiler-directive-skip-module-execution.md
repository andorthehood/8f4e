---
title: 'TODO: Add first compiler directive to skip module execution in cycle'
priority: Medium
effort: 4-6h
created: 2026-02-09
status: Completed
completed: 2026-02-10
---

# TODO: Add first compiler directive to skip module execution in cycle

## Problem Description

We want the first compiler directive to disable runtime execution for specific modules while preserving normal compilation and memory initialization behavior.

Current compiler behavior always includes every compiled module in the generated cycle dispatcher function. This means every module executes each cycle, even when a module should be logically disabled.

## Proposed Solution

Introduce a module-scoped compiler directive (hash-prefixed, after TODO 216 is complete) that is handled through the existing instruction pipeline and marks a module as non-executing in the cycle dispatcher.

Required semantics:
- Module is still compiled normally (AST, memory map, inter-module references preserved).
- Module memory defaults and init behavior still run in init/memory-init path.
- Module cycle function is not called from the global cycle dispatcher.

Suggested directive spelling for v1:
- `#skipExecution`

Placement:
- Allowed anywhere within a module block.

Implementation strategy:
- Treat `#skipExecution` as a dedicated no-op instruction compiler.
- Set a module-level metadata flag in compile context (for example `skipExecutionInCycle = true`).
- Avoid a separate directive pre-pass to keep the implementation simple and minimize extra loops.

## Implementation Plan

### Step 1: Add directive as an instruction compiler
- Add `#skipExecution` to the instruction registry (`packages/compiler/src/instructionCompilers/index.ts`).
- Implement a no-op instruction compiler (for example `packages/compiler/src/instructionCompilers/skipExecutionDirective.ts`) that:
  - verifies module scope
  - sets module context metadata (`skipExecutionInCycle = true`)
- Ignore duplicate `#skipExecution` directives (idempotent behavior).
- Add dedicated compiler directive errors for:
  - unknown hash directive
  - module-only directive used outside module scope

### Step 2: Propagate metadata and exclude flagged modules from cycle dispatcher
- Extend compiler context/module output types to carry `skipExecutionInCycle`.
- In `packages/compiler/src/compiler.ts`, include the metadata on `CompiledModule` result.
- In `packages/compiler/src/index.ts`, when building the global cycle function call list, skip modules marked `skipExecutionInCycle`.
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
- `packages/compiler/src/compiler.ts` - propagate module directive metadata to `CompiledModule`.
- `packages/compiler/src/types.ts` - context + module metadata flag.
- `packages/compiler/src/instructionCompilers/index.ts` - register directive instruction.
- `packages/compiler/src/instructionCompilers/*` - directive instruction compiler implementation.
- `packages/compiler/src/errors.ts` - dedicated compiler directive error codes/messages.
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
- The preferred implementation path is to reuse the existing instruction pipeline rather than adding a separate AST directive pass.
