---
title: 'TODO: Inline intermodule address references during semantic normalization'
priority: Medium
effort: 4-8h
created: 2026-03-27
status: Open
completed: null
---

# TODO: Inline intermodule address references during semantic normalization

## Problem Description

The compiler now resolves intermodule defaults and metadata queries semantically, but intermodule address-style references such as:

- `&module:memory`
- `module:memory&`
- `&module:`
- `module:&`

are still handled as deferred string-shaped references instead of being rewritten into literals once full cross-module layout is known.

This keeps intermodule address handling more complex than necessary:
- some code still has to inspect raw reference strings late
- `push` and default-value paths cannot fully rely on the normalized AST
- the parser/compiler boundary remains weaker than it could be for address-like references

## Proposed Solution

After all module/user memory layouts are finalized, add a semantic normalization step for intermodule address-style references that rewrites them to plain literal arguments.

The intended outcomes are:
- `&module:memory` becomes a literal start address
- `module:memory&` becomes a literal end-address form
- `&module:` becomes the module base address
- `module:&` becomes the module end-address form

This should happen after cross-module layout is known, not during early local-only normalization.

## Anti-Patterns

- Do not mix this with local address-reference inlining; that simpler step belongs in [341](/docs/todos/341-inline-address-references-during-semantic-normalization.md).
- Do not reintroduce post-compile patching of compiled modules just to resolve address literals.
- Do not keep multiple late fallback paths once semantic normalization can own these values.
- Do not treat test-only changes as progress on this todo.
- Do not treat docs-only changes as progress on this todo.
- Do not treat helper renames or helper extraction by themselves as completion if the inlining still happens late.
- Do not add new defensive runtime checks in codegen for intermodule address references that semantic normalization should own.
- Do not preserve the current internal AST/API shape just for backward compatibility if it gets in the way of a clean solution. The software is not released yet, so breaking internal contracts is acceptable here.

## Implementation Plan

### Step 1: Define the semantic timing
- Identify the earliest point where all module byte addresses and module end addresses are known.
- Run intermodule address inlining only after that point.

### Step 2: Resolve intermodule address forms to literals
- Extend semantic address resolution to cover:
  - `&module:memory`
  - `module:memory&`
  - `&module:`
  - `module:&`
- Rewrite those arguments to `ArgumentType.LITERAL`.

Recommended order:

1. `&module:memory`
2. `module:memory&`
3. `&module:`
4. `module:&`

Keep metadata-query forms out of scope unless they are already naturally handled by the same resolution path.

### Step 3: Delete late fallback routing
- Remove any compiler paths that still treat those intermodule address forms as deferred raw strings when they can already be normalized.
- Keep only genuinely late-bound forms if any still exist.

At minimum, remove one real late consumer after the semantic inlining path is in place.

## Validation Checkpoints

- `rg -n "INTERMODULAR_REFERENCE_PATTERN|isIntermodularModuleReference|resolveIntermodularReferenceValue" packages/compiler/src`
- `npx nx run compiler:test --skipNxCache`
- `npx nx run @8f4e/cli:test --skipNxCache`

## Success Criteria

- [ ] Intermodule address references are rewritten to literals once cross-module layout is known.
- [ ] Late compiler paths no longer need to parse intermodule address strings for already-known layouts.
- [ ] Compiler and CLI tests remain green.

## Evidence Required Before Marking Complete

This todo is not done unless all of the following are true:

- `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts` changes materially or becomes less central because intermodule address references are being inlined earlier.
- At least one production semantic normalization path rewrites an intermodule address reference to `ArgumentType.LITERAL`.
- At least one late compiler/codegen consumer stops handling intermodule address references specially because the earlier normalization now owns that responsibility.

The following do not count as completion by themselves:

- tests only
- docs only
- helper renames/extractions only
- adding an earlier optional path while leaving the old late fallback as the real production path

## Affected Components

- `packages/compiler/src/semantic/`
- `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts`
- `packages/compiler/src/graphOptimizer.ts`
- parser-side structured reference TODOs in `@8f4e/tokenizer`

## Risks & Considerations

- **Risk 1**: This must run after final module layout, not during the earlier local-only normalization stage.
- **Risk 2**: Module-base start/end semantics must stay byte-for-byte identical to current behavior.
- **Dependencies**: Strongly related to parser-side classification and structured extraction TODOs.

## Related Items

- **Depends on**: [341-inline-address-references-during-semantic-normalization.md](/docs/todos/341-inline-address-references-during-semantic-normalization.md)
- **Related**: [336-move-identifier-reference-classification-into-tokenizer.md](/docs/todos/336-move-identifier-reference-classification-into-tokenizer.md)
- **Related**: [337-add-structured-address-and-query-extraction-to-tokenizer.md](/docs/todos/337-add-structured-address-and-query-extraction-to-tokenizer.md)

## References

- [resolveIntermodularReferenceValue.ts](/packages/compiler/src/utils/resolveIntermodularReferenceValue.ts)
- [graphOptimizer.ts](/packages/compiler/src/graphOptimizer.ts)
- [341-inline-address-references-during-semantic-normalization.md](/docs/todos/341-inline-address-references-during-semantic-normalization.md)

## Notes

- Local and intermodule address inlining are intentionally split because they happen at different semantic moments.
- This TODO is about inlining already-known cross-module addresses, not changing runtime dependency ordering.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
