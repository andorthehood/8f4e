---
title: 'TODO: Make `push <local>` fully equivalent to `localGet`'
priority: Medium
effort: 2-4h
created: 2026-04-07
status: Open
completed: null
---

# TODO: Make `push <local>` fully equivalent to `localGet`

## Problem Description

`push <identifier>` already supports locals through the internal local fallback path, so `push temp` often behaves like `localGet temp`.

That equivalence is incomplete today:
- `push` does not preserve full local type metadata for `float64` locals the same way `localGet` does.
- Plain identifier resolution for `push` prefers module memory before the local fallback, while `localGet` is unambiguously local-only.

This creates a confusing split in the language surface. The source syntax already suggests that local reads may be done with `push`, but the compiler semantics are not yet strong enough to treat `push <local>` as a true replacement for `localGet`.

## Proposed Solution

Tighten the `push` local path until `push <local>` is semantically equivalent to `localGet <local>` in all supported cases.

Required outcomes:
- preserve `isFloat64` and any other relevant stack metadata when pushing locals
- define and enforce the identifier-resolution rule so `push name` has deterministic local-read semantics when intended
- add regression coverage proving `push <local>` and `localGet <local>` produce equivalent stack metadata and WASM output

This TODO does not remove or deprecate `localGet` yet. It only closes the semantic gap so that a future deprecation would be safe.

## Anti-Patterns

- Do not remove `localGet` before `push <local>` is truly equivalent.
- Do not silently keep different `float32`/`float64` metadata behavior between the two paths.
- Do not leave local-vs-memory identifier ambiguity undocumented or implicit.
- Do not add compatibility fallback logic in this parity pass. Breaking compiler changes are acceptable here because the compiler has not been released yet.

## Implementation Plan

### Step 1: Fix local metadata parity in `push`
- Update the `push` local handler to mirror the stack metadata produced by `localGet`.
- Add explicit coverage for `float64` locals.

### Step 2: Decide the identifier-resolution rule
- Confirm whether local names should shadow memory names for `push`, or whether such collisions should become invalid.
- Implement the chosen rule in identifier resolution and document it.

### Step 3: Add regression tests
- Add tests comparing `push <local>` and `localGet <local>` for `int`, `float`, and `float64`.
- Add coverage for the chosen local-vs-memory collision behavior.

### Step 4: Update docs
- Clarify in the compiler docs that `push <local>` is a supported local-read form once semantics match.
- Keep `localGet` documented separately until any later deprecation decision is made.

## Validation Checkpoints

- `npx nx run compiler:test`
- `rg -n "pushLocal|localGet|isFloat64|resolveIdentifierPushKind" packages/compiler/src`
- `rg -n "\\blocalGet\\b|push <local>|push temp" packages/compiler/docs`

## Success Criteria

- [ ] `push <local>` preserves the same stack metadata as `localGet <local>`.
- [ ] `float64` locals behave identically through both instruction paths.
- [ ] Local-vs-memory identifier resolution is explicit, implemented, and tested.
- [ ] Docs describe the supported local-read behavior without ambiguity.

## Affected Components

- `packages/compiler/src/instructionCompilers/push/handlers/pushLocal.ts`
- `packages/compiler/src/instructionCompilers/localGet.ts`
- `packages/compiler/src/instructionCompilers/push/resolveIdentifierPushKind.ts`
- `packages/compiler/tests`
- `packages/compiler/docs`

## Risks & Considerations

- **Semantic drift**: If `push` and `localGet` keep separate logic, they can diverge again later.
- **Identifier collisions**: Changing resolution order may affect existing programs if local and memory names can overlap.
- **Breaking changes are acceptable**: This work should prefer a clean pre-release semantic model over temporary compatibility layers.
- **Follow-on work**: A future `localGet` removal should be tracked separately after this lands.

## Related Items

- **Related**: `docs/todos/272-add-float-width-type-guarding-to-localset.md`
- **Related**: `docs/todos/261-update-instruction-test-helpers-for-float64.md`
- **Blocks**: `docs/todos/373-remove-localget-and-migrate-sources-to-push.md`

## Notes

- Current compiler behavior already lowers `push <local>` through a dedicated local handler that emits WASM `local.get`.
- The remaining work is semantic parity and explicit language behavior, not first-time implementation.
