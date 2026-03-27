---
title: 'TODO: Inline address references during semantic normalization'
priority: Medium
effort: 4-8h
created: 2026-03-27
status: Open
completed: null
---

# TODO: Inline address references during semantic normalization

## Problem Description

The compiler now folds compile-time metadata queries such as `count(...)`, `sizeof(...)`, `max(...)`, and `min(...)` before codegen, but local address-style identifier operands such as `&buffer` and `buffer&` are still handled in the `push` instruction compiler.

This leaves an avoidable leftover in the runtime/codegen layer:
- `push &buffer` and `push buffer&` are still classified and lowered by `pushMemoryReference`
- `push` still carries identifier-shape routing logic for values that are already known once names are collected and memory layout is finalized
- address literals are not yet treated consistently with other compile-time-resolvable identifier forms

The result is that codegen still has to understand some identifier syntax that should be decided earlier in the semantic pipeline.

## Proposed Solution

Extend semantic normalization so local address-style identifier references are rewritten to plain literal arguments once module memory layout is known.

That means:
- `&buffer` becomes a `LITERAL` with the start byte address of `buffer`
- `buffer&` becomes a `LITERAL` with the end-address form of `buffer`
- intermodule address references are intentionally out of scope for this TODO

After that:
- `pushMemoryReference.ts` can be deleted
- `push.ts` no longer needs to route address references specially
- `resolveIdentifierPushKind.ts` can shrink further

## Anti-Patterns

- Do not keep a fallback codegen path for local address references once semantic normalization can inline them.
- Do not reintroduce synthetic parser logic into `push` just to preserve old direct unit tests.
- Do not mix this with intermodule reference redesign; local address inlining should be the first step.

## Implementation Plan

### Step 1: Extend semantic compile-time resolution to handle local address references
- Teach semantic normalization to resolve `&name` and `name&` once `namespace.memory` is finalized.
- Produce `ArgumentType.LITERAL` values for those address references before codegen.

### Step 2: Delete the codegen-side push address handler
- Remove `pushMemoryReference.ts`.
- Remove the memory-reference branch from `push.ts`.
- Simplify `resolveIdentifierPushKind.ts` accordingly.

### Step 3: Rebase tests on the semantic boundary
- Update any direct `push` unit tests that still pass raw address identifiers without normalization.
- Prefer integration coverage where the semantic pass runs first.

## Validation Checkpoints

- `rg -n "pushMemoryReference|MEMORY_REFERENCE" packages/compiler/src`
- `npx nx run compiler:test --skipNxCache`
- `npx nx run @8f4e/cli:test --skipNxCache`

## Success Criteria

- [ ] Local address references are inlined to literals during semantic normalization.
- [ ] `pushMemoryReference.ts` is deleted.
- [ ] `push.ts` no longer contains a dedicated local address-reference branch.
- [ ] Compiler and CLI tests remain green.

## Affected Components

- `packages/compiler/src/semantic/normalizeCompileTimeArguments.ts` - semantic inlining entry point
- `packages/compiler/src/semantic/resolveCompileTimeArgument.ts` - address reference resolution
- `packages/compiler/src/instructionCompilers/push.ts` - remove address fallback branch
- `packages/compiler/src/instructionCompilers/push/resolveIdentifierPushKind.ts` - simplify remaining identifier routing
- `packages/compiler/src/instructionCompilers/push/handlers/pushMemoryReference.ts` - delete after refactor

## Risks & Considerations

- **Risk 1**: End-address semantics (`name&`) must stay byte-for-byte identical to current codegen behavior.
- **Risk 2**: Direct unit tests that bypass normalization may fail and should be updated rather than forcing fallback behavior to remain.
- **Dependencies**: Best paired with the parser-side TODOs for richer identifier/reference classification.
- **Out of scope**: Intermodule address-reference inlining is tracked separately.

## Related Items

- **Related**: [336-move-identifier-reference-classification-into-ast-parser.md](/Users/andorpolgar/git/8f4e/docs/todos/336-move-identifier-reference-classification-into-ast-parser.md)
- **Related**: [337-add-structured-address-and-query-extraction-to-ast-parser.md](/Users/andorpolgar/git/8f4e/docs/todos/337-add-structured-address-and-query-extraction-to-ast-parser.md)
- **Related**: [338-add-richer-compile-time-expression-ast-nodes.md](/Users/andorpolgar/git/8f4e/docs/todos/338-add-richer-compile-time-expression-ast-nodes.md)
- **Related**: [342-inline-intermodule-address-references-during-semantic-normalization.md](/Users/andorpolgar/git/8f4e/docs/todos/342-inline-intermodule-address-references-during-semantic-normalization.md)

## References

- [push.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/push.ts)
- [pushMemoryReference.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/push/handlers/pushMemoryReference.ts)
- [normalizeCompileTimeArguments.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/semantic/normalizeCompileTimeArguments.ts)
- [resolveCompileTimeArgument.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/semantic/resolveCompileTimeArgument.ts)

## Notes

- This is the local-address counterpart to the already-completed metadata-query cleanup in `push`.
- The recent deletion of `pushElementCount`, `pushElementWordSize`, `pushElementMax`, and related handlers confirmed that the semantic layer is the right place for these inlinings.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
