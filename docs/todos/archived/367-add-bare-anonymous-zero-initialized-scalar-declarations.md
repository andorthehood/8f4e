---
title: 'TODO: Add bare anonymous zero-initialized scalar declarations'
priority: Medium
effort: 2-4h
created: 2026-04-03
status: Completed
completed: 2026-04-25
---

# TODO: Add bare anonymous zero-initialized scalar declarations

## Problem Description

The compiler already supports anonymous scalar memory declarations when the first token is also the default value, for example:
- `int 42`
- `int FOO`
- `float 0.5`

It also supports named scalar declarations with an implicit zero default:
- `int counter`
- `float gain`

What it does not support is a bare scalar declaration with no identifier and no explicit initializer:
- `int`
- `float`
- `float64`
- pointer scalar variants such as `int*`

Why this is a problem:
- it creates an unnecessary inconsistency between named and anonymous scalar declarations
- users can already express anonymous declarations with explicit defaults, so bare scalar declarations are the remaining missing zero-initialized form
- the current behavior forces users to write a value token even when they specifically want an anonymous zeroed cell

## Proposed Solution

Add support for zero-argument scalar memory declarations and interpret them as anonymous zero-initialized allocations.

Desired behavior:
- `int` creates an anonymous `int` with default `0`
- `float` creates an anonymous `float` with default `0`
- `float64` creates an anonymous `float64` with default `0`
- scalar pointer declarations such as `int*` or `float*` also create anonymous zero-initialized pointer slots

Compatibility requirements:
- keep existing anonymous-value forms unchanged: `int 42`, `int FOO`, `float 0.5`, etc.
- keep named implicit-zero declarations unchanged: `int counter`, `float value`
- do not extend this feature to arrays; `int[]` without a size should remain invalid

Implementation approach:
- treat `args.length === 0` in scalar declaration parsing as a valid anonymous declaration
- generate the same anonymous id shape already used elsewhere: `__anonymous__${lineNumberAfterMacroExpansion}`
- return a zero default value without disturbing any existing declaration path

## Anti-Patterns

- Do not change the meaning of `int 42` or `int FOO`; those existing anonymous forms must continue to work exactly as they do today.
- Do not add implicit sizing for arrays such as `int[]`; array declarations still require an element count.
- Do not introduce a new keyword or directive for this when the existing declaration parser can absorb the feature with a localized change.
- Do not move this into compiler-error handling if the behavior can be expressed directly in the declaration argument parser.

## Implementation Plan

### Step 1: Extend scalar declaration argument parsing
- Update [`packages/compiler/src/utils/memoryInstructionParser.ts`](../../packages/compiler/src/utils/memoryInstructionParser.ts) so zero-argument scalar declarations return an anonymous id plus `defaultValue: 0`.
- Keep the existing branches for literal-first and constant-style anonymous declarations unchanged.
- Preserve the current named-declaration fallback where a missing second token means default `0`.

### Step 2: Add focused compiler tests
- Add a unit test in [`packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts`](../../packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts) for zero arguments returning an anonymous zero-initialized declaration.
- Add or extend instruction-level tests for representative scalar declarations:
- `int`
- `float`
- one scalar pointer variant such as `int*`
- Verify existing tests for `int 42` and `int FOO` still pass unchanged.

### Step 3: Update documentation
- Update [`packages/compiler/docs/instructions/declarations-and-locals.md`](../../packages/compiler/docs/instructions/declarations-and-locals.md) to document the new bare scalar form.
- Clarify that anonymous scalar declarations now have three supported forms:
- bare implicit zero, e.g. `int`
- anonymous literal/value, e.g. `int 42`
- anonymous constant-style identifier, e.g. `int FOO`
- Explicitly state that this behavior applies only to scalar declarations, not array declarations.

### Step 4: Validate with Nx targets
- Run compiler tests through Nx.
- Run compiler typecheck through Nx if any declaration typing is touched.
- Confirm the docs examples match the implemented behavior.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "anonymous|int 42|int FOO|int$|float$" packages/compiler`

## Success Criteria

- [ ] `int`, `float`, `float64`, and scalar pointer declarations compile with no arguments.
- [ ] Zero-argument scalar declarations create anonymous allocations with default `0`.
- [ ] Existing anonymous forms such as `int 42` and `int FOO` still behave exactly as before.
- [ ] Named scalar declarations such as `int counter` still default to `0`.
- [ ] Array declarations still require their size argument and are unaffected.
- [ ] Documentation explicitly describes the new bare scalar form and its scalar-only scope.

## Affected Components

- `packages/compiler/src/utils/memoryInstructionParser.ts` - zero-argument scalar declaration handling
- `packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts` - parser-level regression coverage
- `packages/compiler/tests/instructions/` - instruction-level coverage for scalar declarations
- `packages/compiler/docs/instructions/declarations-and-locals.md` - user-facing syntax documentation

## Risks & Considerations

- **Ambiguity with missing-name mistakes**: bare `int` currently looks like an incomplete declaration to a reader. The docs should clearly state that it intentionally allocates an anonymous zero-initialized scalar.
- **Scope creep into arrays**: this should remain scalar-only; arrays without sizes are still underspecified and should keep failing.
- **Hidden id stability**: anonymous ids are line-number derived today, so tests should assert behavior in a way that matches the existing anonymous-id convention rather than inventing a new scheme.

## Related Items

- **Related**: `356-consolidate-declaration-compilers-into-factory.md`
- **Related**: `362-refactor-argumentidentifier-to-discriminated-union.md`
- **Related**: `docs/todos/archived/363-enforce-classifyidentifier-check-ordering.md`
- **Related**: `archived/308-simplify-memory-instruction-default-value-resolution.md`

## Notes

- The implementation should stay localized to scalar declaration parsing rather than spreading special cases across individual declaration compilers.
- The existing tokenizer contract can remain unchanged because scalar declarations already do not require a tokenizer-level minimum argument count.
- If this feature later proves confusing, an editor-side lint or warning for bare anonymous declarations could be added without removing compiler support.
