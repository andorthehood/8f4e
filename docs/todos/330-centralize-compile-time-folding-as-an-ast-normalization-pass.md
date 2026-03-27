---
title: 'TODO: Centralize compile-time folding as an AST normalization pass'
priority: High
effort: 6-10 hours
created: 2026-03-27
status: Open
completed: null
---

# TODO: Centralize compile-time folding as an AST normalization pass

## Problem Description

Compile-time expressions are still recognized and resolved across multiple layers:

- parser fallback logic in `parseArgument()`
- compile-time expression parsing helpers
- push routing
- declaration/default helpers
- downstream value resolvers

This violates the intended refactor target. The compiler should have one semantic stage that rewrites compile-time-resolvable arguments into plain literals before normal instruction compilation.

## Proposed Solution

Introduce a single AST normalization pass that runs after namespace collection and before codegen. That pass should:

- inspect only the supported compile-time value positions
- resolve literals, consts, and metadata queries
- fold single-operator compile-time `*` / `/` expressions
- rewrite those arguments to `ArgumentType.LITERAL`

After this step, instruction compilers should not need to decide whether a value-shaped identifier is “really” a compile-time expression.

## Anti-Patterns

- Keeping both normalization and downstream resolution as first-class paths.
- Performing compile-time routing inside `push` or declaration instruction compilers after normalization exists.
- Expanding normalization to unsupported instruction/argument positions without a clear ownership map.

## Implementation Plan

### Step 1: Define the normalization boundary
- List exactly which argument positions are owned by compile-time folding in this pass:
  - `const` RHS
  - `push` value
  - `init` value
  - declaration/default value positions
  - other compile-time-only value positions already supported by the language

### Step 2: Route all supported compile-time forms through one resolver
- Use one resolver API for literals, const identifiers, metadata queries, and single-operator compile-time expressions.
- Support intermodule metadata queries in the same pass if they are already legal elsewhere.

### Step 3: Rewrite AST arguments and preserve diagnostics
- Replace identifier-shaped compile-time expressions with literal AST arguments.
- Preserve source line context so later compiler errors still point to the original source line.

## Validation Checkpoints

- `rg -n "isCompileTimeValueOrExpression|resolveIdentifierPushKind|resolveConstantValueOrExpressionOrThrow" packages/compiler/src`
- `npx nx run compiler:test`
- Add tests that inspect normalized AST output through existing snapshots

## Success Criteria

- [ ] Supported compile-time value positions are rewritten to literals before instruction compilation
- [ ] Intermodule metadata expressions resolve through the same pass when legal
- [ ] AST snapshots show folded literals instead of expression-shaped identifiers in normalized positions

## Affected Components

- `packages/compiler/src/compiler.ts`
- `packages/compiler/src/utils/resolveConstantValue.ts`
- `packages/compiler/src/syntax/parseArgument.ts`
- `packages/compiler/tests/instructions/*.test.ts`

## Risks & Considerations

- **Risk**: Over-normalizing identifier-definition positions such as declaration names.
- **Risk**: Intermodule metadata may still require data not available until after module ordering.
- **Dependency**: Depends on 329 for reliable namespace materialization.

## Related Items

- **Depends on**: 329
- **Blocks**: 331
- **Related**: 308, 325, 328

## Notes

- The purpose of this step is centralization, not feature expansion. If a case is not already intended to be compile-time-foldable, do not silently add it here.
