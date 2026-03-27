---
title: 'TODO: Replace literal-only const collection with semantic namespace prepass'
priority: High
effort: 6-10 hours
created: 2026-03-27
status: Open
completed: null
---

# TODO: Replace literal-only const collection with semantic namespace prepass

## Problem Description

The compiler still builds module/constant namespaces through `collectConstants(ast)`, which assumes every `const` RHS is already a literal. That was viable before compile-time `*` and `/` support, but it breaks the intended ownership boundary:

- names are not collected through the same semantic rules used later by compilation
- constants blocks and module-local const declarations are partially re-parsed in other places
- compile-time folding cannot cleanly depend on a single authoritative namespace build step

This keeps the compiler in a half-refactored state where namespace assembly and compile-time resolution are separate, inconsistent mechanisms.

## Proposed Solution

Replace the literal-only `collectConstants(ast)` namespace bootstrap with a semantic prepass that walks the AST in source order and builds:

- visible constants
- visible memory metadata
- `use`-imported constant visibility
- block/module identity needed for later intermodule queries

The prepass must be the single owner of namespace materialization before codegen. It should use the same compile-time resolution rules the compiler will later use for folding.

## Anti-Patterns

- Keeping `collectConstants(ast)` as the namespace source while adding more post-hoc fallbacks elsewhere.
- Building one namespace for constants and a second ad hoc namespace for memory metadata.
- Re-parsing declarations separately in multiple helper paths.

## Implementation Plan

### Step 1: Define prepass scope and ownership
- Enumerate which instructions mutate namespace state during semantic setup: `module`, `constants`, `use`, `const`, declarations, and any other namespace-defining forms.
- Make the prepass explicitly source-ordered so later const declarations can depend on earlier ones but not vice versa.

### Step 2: Replace `collectConstants(ast)` in namespace assembly
- Update the compiler pipeline in `packages/compiler/src/index.ts` to build namespaces from the semantic prepass instead of literal AST collection.
- Ensure the namespace table stores both `consts` and `memory` where needed for later compile-time metadata lookup.

### Step 3: Keep prepass and codegen in sync
- Reuse the same semantic helpers where possible instead of introducing a second declaration implementation.
- Confirm constants blocks used through `use` expose computed consts correctly.

## Validation Checkpoints

- `rg -n "collectConstants\\(ast\\)" packages/compiler/src`
- `npx nx run compiler:test`
- Add tests for constants blocks with computed consts consumed via `use`

## Success Criteria

- [ ] Namespace assembly no longer depends on `collectConstants(ast)` as the primary semantic source
- [ ] Computed consts in constants blocks are visible through `use`
- [ ] Namespace-building behavior is source-ordered and test-covered

## Affected Components

- `packages/compiler/src/index.ts`
- `packages/compiler/src/compiler.ts`
- `packages/compiler/src/astUtils/collectConstants.ts`
- `packages/compiler/tests/instructions/constantExpressions.test.ts`

## Risks & Considerations

- **Risk**: `use` semantics may drift if the prepass does not mirror runtime compilation order closely enough.
- **Risk**: Intermodule namespace availability may be sensitive to module sorting.
- **Breaking Changes**: Constants that previously worked only by accident may start failing if declaration order is now enforced consistently.

## Related Items

- **Blocks**: 330, 331
- **Related**: 257, 301

## Notes

- This is the prerequisite step for a true compile-time folding refactor. Without a semantic namespace prepass, later “normalization” work remains additive rather than centralizing.
