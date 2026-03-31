---
title: 'TODO: Unify semantic const collection and namespace import rules'
priority: High
effort: 1-2d
created: 2026-03-30
status: Completed
completed: 2026-03-31
---

# TODO: Unify semantic const collection and namespace import rules

## Problem Description

Constant declarations should have one clear semantic path into namespace data and `use` imports.

Current behavior:
- namespace construction goes through `packages/compiler/src/semantic/buildNamespace.ts`
- `const` normalization lives in `packages/compiler/src/semantic/normalization/const.ts`
- semantic application lives in `packages/compiler/src/semantic/instructions/const.ts`
- `use` still consumes namespace consts via the namespace registry

Why this is a problem:
- it is not obvious yet that namespace-visible consts and normal semantic const handling share one clean source of truth
- if namespace collection and semantic const handling drift, `use` behavior becomes harder to reason about

## Proposed Solution

Refactor the current semantic const pipeline so namespace-visible const collection and normal semantic const handling clearly share the same validation and declaration rules.

High-level approach:
- identify the current overlap between:
  - namespace collection in `buildNamespace.ts`
  - const normalization in `normalization/const.ts`
  - semantic application in `semantic/instructions/const.ts`
- extract any remaining shared const-declaration rule into one semantic helper or one clearly owned path
- keep `use` reading from validated namespace data only

## Anti-Patterns

- Do not reintroduce old `collectConstants(...)`-style extraction logic.
- Do not add a second ad hoc const parser beside the semantic normalization path.
- Do not move syntax validation out of tokenizer.
- Do not fix this by adding defensive runtime checks for malformed internal AST states.
- Do not preserve obsolete helper boundaries just for compatibility; internal breaking changes are acceptable.

## Implementation Plan

### Step 1: Map the current const pipeline
- Trace how a `const` declaration flows through:
  - tokenizer output
  - `normalizeConst`
  - namespace construction in `buildNamespace.ts`
  - semantic application in `semanticConst`
  - `use` namespace consumption

### Step 2: Extract or clarify the single source of truth
- Consolidate any remaining duplicated const-declaration rule into one semantic helper or one clearly owned path.
- Make it obvious which declarations become namespace-visible/importable and why.

### Step 3: Keep `use` behavior explicit
- Ensure `use` still imports validated constants from constants blocks and modules as intended.
- Keep block-scope and importability rules explicit rather than implicit side effects of traversal order.

### Step 4: Add regression coverage
- Cover malformed const declarations
- Cover constants blocks
- Cover module-level consts imported through `use`
- Cover any scoping/importability edge that the refactor clarifies

## Validation Checkpoints

- `sed -n '1,280p' packages/compiler/src/semantic/buildNamespace.ts`
- `sed -n '1,220p' packages/compiler/src/semantic/normalization/const.ts`
- `sed -n '1,120p' packages/compiler/src/semantic/instructions/const.ts`
- `rg -n "use|consts" packages/compiler/src/semantic packages/compiler/tests`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache -- packages/compiler/tests/instructions/constants.test.ts packages/compiler/tests/instructions/constantExpressions.test.ts`

## Success Criteria

- [x] Namespace-visible const collection and normal semantic const handling share one clear validation/declaration path.
- [x] `use` continues to import constants correctly from constants blocks and modules.
- [x] The const pipeline is described by the current semantic architecture, not legacy collection helpers.
- [x] Regression tests cover malformed declarations and import behavior.

## Affected Components

- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/semantic/normalization/const.ts`
- `packages/compiler/src/semantic/instructions/const.ts`
- `packages/compiler/src/semantic/instructions/use.ts`
- `packages/compiler/tests/instructions/constants.test.ts`
- `packages/compiler/tests/instructions/constantExpressions.test.ts`

## Risks & Considerations

- **Import semantics**: changing namespace-visible const rules can subtly affect `use`.
- **Scope clarity**: function-local or non-importable consts must not leak into namespace imports accidentally.
- **Architecture drift**: the goal is to simplify around the current semantic model, not recreate an older collector design.

## Related Items

- **Related**: `docs/todos/292-refactor-error-systems-and-document-syntax-vs-compiler-error-boundaries.md`

## Notes

- The goal is still to make const/import behavior consistent, but now in terms of the semantic pipeline that actually exists today.
