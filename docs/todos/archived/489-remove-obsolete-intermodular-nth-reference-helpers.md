---
title: 'TODO: Remove obsolete intermodular nth-reference helpers'
priority: Low
effort: 1h
created: 2026-09-30
issue: null
status: Completed
completed: 2026-09-30
---

# TODO: Remove Obsolete Intermodular Nth-Reference Helpers

## Problem Description

The tokenizer retains two legacy helpers for the `&module:<index>` intermodular nth-memory-reference form:

- `isIntermodularModuleNthReference.ts`
- `extractIntermodularModuleNthReferenceBase.ts`

Neither helper is imported by production code or exported from the tokenizer syntax API. Each is referenced only by its
own unit test. The live argument parser now recognizes and decomposes the same syntax inside
`parseArgument/classifyIntermodularReference.ts`, where it produces the structured
`intermodular-module-nth-reference` identifier consumed by later compiler stages.

Keeping the superseded helpers and isolated tests makes it appear that two parsing paths must remain synchronized when
only the classifier participates in compilation.

## Proposed Solution

Delete the two obsolete helpers and their dedicated tests. Preserve the `&module:<index>` language feature, its
structured identifier type, the live classifier coverage, and all downstream memory-reference resolution behavior.

## Anti-Patterns

- Do not remove or deprecate the `&module:<index>` syntax itself.
- Do not move production parsing back to the regex-based helper.
- Do not add compatibility exports for helpers that were never part of the tokenizer's exported syntax surface.
- Do not weaken the live classifier tests for malformed module names, missing indices, or non-decimal indices.

## Implementation Plan

### Step 1: Reconfirm the active parsing path

- Verify that `classifyIntermodularReference` handles decimal nth references and returns
  `referenceKind: 'intermodular-module-nth-reference'` with `targetModuleId` and `targetMemoryIndex`.
- Confirm repository-wide that the two legacy helper names occur only in their source files and tests.

### Step 2: Delete the obsolete files

- Remove `isIntermodularModuleNthReference.ts` and its test.
- Remove `extractIntermodularModuleNthReferenceBase.ts` and its test.
- Remove any stale documentation comments or barrel exports discovered during implementation.

### Step 3: Preserve live behavior coverage

- Confirm `syntax/parseArgument.test.ts` covers a valid `&module:0` reference and representative invalid forms.
- Add missing cases to that active parser suite only if the deleted helper tests contain behavior not already covered.

## Validation Checkpoints

- `rg -n "isIntermodularModuleNthReference|extractIntermodularModuleNthReferenceBase" packages/compiler`
- `npx nx run @8f4e/tokenizer:test`
- `npx nx run @8f4e/tokenizer:typecheck`
- `npx nx run @8f4e/compiler:test`
- `npx nx run @8f4e/compiler:typecheck`

## Success Criteria

- [x] Both legacy helper files and their dedicated tests are removed.
- [x] No source import, export, or active test refers to either helper name.
- [x] `&module:<index>` continues to classify as an intermodular module nth reference.
- [x] Malformed nth references retain active parser coverage.
- [x] Tokenizer and compiler tests and typechecks pass.

## Affected Components

- `packages/compiler/packages/sub-program/packages/tokenizer/src/syntax/isIntermodularModuleNthReference.ts` - remove
  the obsolete predicate.
- `packages/compiler/packages/sub-program/packages/tokenizer/src/syntax/isIntermodularModuleNthReference.test.ts` -
  remove isolated coverage for the dead predicate.
- `packages/compiler/packages/sub-program/packages/tokenizer/src/syntax/extractIntermodularModuleNthReferenceBase.ts` -
  remove the obsolete extractor.
- `packages/compiler/packages/sub-program/packages/tokenizer/src/syntax/extractIntermodularModuleNthReferenceBase.test.ts`
  - remove isolated coverage for the dead extractor.
- `packages/compiler/packages/sub-program/packages/tokenizer/src/syntax/parseArgument.test.ts` - retain or supplement
  coverage for the live parser.

## Risks & Considerations

- **Hidden consumers**: Static imports are absent, but run repository-wide search and typechecking before finalizing the
  deletion.
- **Behavior migration**: If a useful invalid-input case exists only in a legacy helper test, express it at the public
  classifier boundary rather than preserving the helper.
- **Scope control**: This is dead-code removal, not a redesign of intermodular reference syntax or semantic resolution.

## Related Items

- **Related implementation**:
  `packages/compiler/packages/sub-program/packages/tokenizer/src/syntax/parseArgument/classifyIntermodularReference.ts`

## Notes

A repository audit on 2026-09-30 confirmed that the helpers are test-only while the syntax remains live through the
centralized argument classifier.

Completed on 2026-09-30 by deleting both test-only helpers and moving their useful shape assertions to the active
identifier-classifier suite. Tokenizer and compiler tests and typechecks pass with nth-reference syntax unchanged.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update
`docs/todos/_index.md`.
