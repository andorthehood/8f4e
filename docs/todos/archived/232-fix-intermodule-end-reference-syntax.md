---
title: 'TODO: Fix inter-module end-reference syntax to module.foo&'
priority: Medium
effort: 2-4h
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Fix inter-module end-reference syntax to module.foo&

## Problem Description

The currently implemented inter-module end-address syntax uses `&module.foo&`.

That is incorrect for the agreed language design. The intended syntax is:
- start address: `&module.foo`
- end address: `module.foo&`

This mismatch creates inconsistent mental models with existing postfix behavior (`buffer&`) and makes inter-module references harder to read.

Current implementation points (leading `&` only):
- `packages/compiler/src/syntax/isIntermodularReference.ts` uses `^&...` matching.
- `packages/compiler/src/syntax/isIntermodularReferencePattern.ts` uses `^&...` matching for dependency/AST detection.
- `packages/compiler/src/utils/resolveInterModularConnections.ts` strips a leading `&` when parsing inter-module references.
- `packages/compiler/src/graphOptimizer.ts` assumes references start with `&` when extracting dependency module IDs.
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/connections.ts` draws wires from resolved pointer values, so it depends on compiler resolution recognizing the correct syntax.

## Proposed Solution

Update inter-module end-address handling to accept `module.foo&` and reject `&module.foo&`.

Scope:
- parser/syntax classification
- deferred inter-module resolution pass
- dependency extraction in module sort
- tests and docs/TODO wording that still describe the wrong form

No compatibility mode is needed.

## Implementation Plan

### Step 1: Correct syntax matcher/classifier rules
- Update inter-module syntax helpers to recognize:
  - `&module.memory` (start)
  - `module.memory&` (end)
- Reject:
  - `&module.memory&`
  - multi-dot forms
  - malformed separators

### Step 2: Update deferred resolver parsing
- Update `packages/compiler/src/index.ts` inter-module resolver parsing logic so `module.memory&` maps to `isEndAddress = true`.
- Keep start-address behavior unchanged for `&module.memory`.

### Step 3: Update graph dependency extraction
- Update `packages/compiler/src/graphOptimizer.ts` dependency detection so both supported inter-module forms contribute dependencies:
  - `&module.memory`
  - `module.memory&`

### Step 4: Update tests in dedicated folder
- Add/update tests under `packages/compiler/tests/intermodular-references/`:
  - end reference with `module.buffer&`
  - start reference with `&module.buffer`
  - rejection of `&module.buffer&`
  - scalar and buffer end-address semantics
  - sorting behavior for both forms
- Keep syntax/unit tests aligned in `packages/compiler/src/syntax/*` and parser utility tests where relevant.

### Step 5: Update docs/TODO references
- Update TODO/docs text that still mentions `&module.memory&`.
- Ensure examples consistently use `module.memory&` for end-address inter-module references.

## Validation Checkpoints

- `npx nx run compiler:test`
- `rg -n "&module\\.[^\\s&]+&|module\\.[^\\s&]+&|&module\\.[^\\s&]+" packages/compiler/src packages/compiler/tests packages/compiler/docs docs/todos -S`
- Verify no expected-positive tests still rely on `&module.memory&`.

## Success Criteria

- [ ] `module.memory&` is accepted and resolved as inter-module end address.
- [ ] `&module.memory&` is rejected.
- [ ] `&module.memory` remains valid start-address syntax.
- [ ] Dependency sorting includes both supported forms.
- [ ] Compiler tests pass.

## Affected Components

- `packages/compiler/src/syntax/isIntermodularReference.ts`
- `packages/compiler/src/syntax/memoryInstructionParser.ts`
- `packages/compiler/src/utils/memoryInstructionParser.ts`
- `packages/compiler/src/syntax/isIntermodularReferencePattern.ts`
- `packages/compiler/src/index.ts`
- `packages/compiler/src/utils/resolveInterModularConnections.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/connections.ts`
- `packages/compiler/tests/intermodular-references/*`
- `docs/todos/226-support-intermodule-buffer-end-reference.md`

## Risks & Considerations

- **Risk 1**: Resolver and syntax matcher drift.
  - Mitigation: lock behavior with positive/negative tests for both supported forms.
- **Risk 2**: Sort dependency parser not updated for postfix inter-module form.
  - Mitigation: add explicit sort regression test for `module.memory&`.
- **Risk 3**: Hidden stale references in docs/tests.
  - Mitigation: grep checkpoint for old pattern `&module.*&`.

## Related Items

- `docs/todos/226-support-intermodule-buffer-end-reference.md`
- `docs/todos/227-support-intermodule-element-count-reference.md`
- `docs/todos/228-support-intermodule-element-word-size-reference.md`
- `docs/todos/229-support-intermodule-element-max-reference.md`
- `docs/todos/230-support-intermodule-element-min-reference.md`
