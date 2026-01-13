---
title: 'TODO: Add Conditional Schema Support to Stack Config Compiler'
priority: Medium
effort: 2-4d
created: 2026-01-13
status: Completed
completed: 2026-01-13
---

# TODO: Add Conditional Schema Support to Stack Config Compiler

## Problem Description

The stack-config compiler schema validator only supports a small JSON Schema subset
(`type`, `enum`, `properties`, `required`, `items`, `additionalProperties`). This makes
it impossible to express conditional runtime config rules like: "if `runtime` is
`AudioWorkletRuntime`, then `audioOutputBuffers` is required and `midiNoteInputs` is
invalid." As a result, runtime configs are validated too loosely or require a second
validation pass elsewhere.

## Proposed Solution

Extend the schema subset to support conditional composition via `oneOf`/`anyOf`
(`allOf` optional), then teach the compiler's schema validator to handle these
combinators when validating navigation and values. This enables proper runtime-specific
validation inside config compilation, allowing editor-state to generate conditional
schemas from a runtime registry without post-compile validation.

## Implementation Plan

### Step 1: Extend schema types and preprocessing
- Add `oneOf?: JSONSchemaLike[]` and `anyOf?: JSONSchemaLike[]` to `JSONSchemaLike`
  in `packages/stack-config-compiler/src/schema/types.ts`.
- Update preprocessing (`preprocessSchema`) and `SchemaNode` construction to preserve
  combinators as explicit alternate branches (e.g. `alternatives: SchemaNode[]`).
- Define minimal semantics for `oneOf` and `anyOf` in docs/tests.

### Step 2: Support combinators in navigation and value validation
- Update `lookupSchemaNode`, `validateNavigationSegment`, and `validateNavigation` to
  resolve a path against all alternatives, keeping only branches that remain valid.
- Update `validateValue` to evaluate value validation across alternatives:
  - `anyOf`: valid if at least one branch validates.
  - `oneOf`: valid if exactly one branch validates; otherwise emit a schema error that
    identifies ambiguous or non-matching branches.
- Ensure error messages include the path and a concise reason when combinators fail.

### Step 3: Add tests and documentation
- Add targeted unit tests in `packages/stack-config-compiler/src/__tests__` for:
  - `oneOf` with discriminator fields (runtime enum + required fields).
  - `anyOf` with overlapping shapes.
  - error messaging for no match and multiple matches.
- Update `packages/stack-config-compiler/README.md` to document the new schema subset
  support and provide an example runtime schema.
- Add a follow-up note in editor-state docs to use generated conditional schemas.

## Success Criteria

- [ ] Compiler validates runtime-specific config objects using `oneOf`/`anyOf` without
      any post-compile validation layer.
- [ ] Schema validation errors correctly report the failing path and combinator reason.
- [ ] Unit tests cover success and failure cases for `oneOf`/`anyOf`.

## Affected Components

- `packages/stack-config-compiler/src/schema/types.ts` - Add combinator fields.
- `packages/stack-config-compiler/src/schema/preprocessSchema.ts` - Preserve combinator branches.
- `packages/stack-config-compiler/src/schema/lookupSchemaNode.ts` - Navigate alternatives.
- `packages/stack-config-compiler/src/schema/validateNavigationSegment.ts` - Validate path segments with alternatives.
- `packages/stack-config-compiler/src/schema/validateValue.ts` - Apply combinator logic during value validation.
- `packages/stack-config-compiler/README.md` - Document the extended schema subset.

## Risks & Considerations

- **Ambiguous schemas**: `oneOf` can fail when multiple branches match; error messages
  must be clear enough for users to resolve conflicts.
- **Performance**: Evaluating multiple branches may be slower; implement pruning to
  drop invalid branches early.
- **Compatibility**: Ensure existing schemas without combinators behave identically.
- **Breaking Changes**: None expected if new fields are optional and ignored by old schemas.

## Related Items

- **Depends on**: None.
- **Related**: Runtime registry and runtime config decoupling (new TODO to be added).

## References

- `packages/stack-config-compiler/src/schema/types.ts`
- `packages/editor/packages/editor-state/src/configSchema.ts`

## Notes

- Prefer `oneOf` for discriminated unions (`runtime` field) and reserve `anyOf` for
  overlapping shapes where ambiguity is acceptable.
- If `allOf` becomes necessary, treat it as an intersection of constraints; consider
  adding it only after `oneOf`/`anyOf` are stable.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
