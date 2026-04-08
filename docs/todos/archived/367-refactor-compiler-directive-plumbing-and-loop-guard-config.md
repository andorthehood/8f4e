---
title: 'TODO: Refactor compiler directive plumbing and loop guard config'
priority: Medium
effort: 4-8h
created: 2026-04-03
status: Completed
completed: 2026-04-08
---

# TODO: Refactor compiler directive plumbing and loop guard config

## Problem Description

Recent compiler directive work exposed a few small but repeated structural issues in the compiler/tokenizer pipeline.

Current issues:
- [packages/compiler/src/instructionCompilers/initOnly.ts](packages/compiler/src/instructionCompilers/initOnly.ts) and [packages/compiler/src/instructionCompilers/skipExecution.ts](packages/compiler/src/instructionCompilers/skipExecution.ts) duplicate the same directive pattern:
  - validate block context
  - mutate one field on `CompilationContext`
  - emit no runtime bytecode
  - maintain nearly identical tests
- [packages/compiler/src/instructionCompilers/loop.ts](packages/compiler/src/instructionCompilers/loop.ts) embeds the fallback loop cap `1000` directly in codegen instead of using a named compiler constant
- typed AST support is still looser than it should be around directives and `loop`, which makes compiler code reach for broad `AST[number]` shapes more often than necessary
- tokenizer-side directive helpers like [packages/compiler/packages/tokenizer/src/syntax/isSkipExecutionDirective.ts](packages/compiler/packages/tokenizer/src/syntax/isSkipExecutionDirective.ts) appear disconnected from the main parser path, which now relies on general instruction parsing plus argument validation

Why this matters:
- new directives like `#loopCap` will multiply boilerplate unless the directive path is simplified
- magic values in codegen make future behavior changes harder to reason about and easier to miss in tests
- a weaker tokenizer-to-compiler contract invites local casts and duplicated validation
- orphaned directive helpers create uncertainty about which path is authoritative

## Proposed Solution

Do a small targeted cleanup around directive handling and loop guard configuration before or alongside future directive additions.

High-level approach:
- introduce a shared helper or factory for compiler directives that only mutate `CompilationContext`
- extract the built-in loop fallback cap into a named compiler constant
- tighten typed AST coverage for `loop` and compiler directives that have stable argument shapes
- audit tokenizer directive-specific helpers and either:
  - remove them if they are obsolete, or
  - fold them into a single explicit directive parsing strategy

This is not meant to redesign the full compiler architecture. The goal is to remove the obvious repetition and ambiguity that will otherwise grow as more directives are added.

## Anti-Patterns

- Do not build a large generic “meta-instruction framework” if a small helper solves the real duplication.
- Do not move syntax-only validation back out of the tokenizer; the current tokenizer-owned arity/shape boundary should stay intact.
- Do not change runtime behavior while performing the cleanup.
- Do not preserve dead directive helper code just because it already exists.

## Implementation Plan

### Step 1: Extract a shared compiler-directive helper
- Add a small utility for directives that:
  - validate allowed scope or enclosing block types
  - apply a context mutation
  - return the unchanged bytecode stream
- Migrate `#skipExecution` and `#initOnly` to that helper.
- Use the same helper shape for future directives such as `#loopCap`.

### Step 2: Centralize loop guard defaults
- Move the fallback loop cap value into a named compiler constant.
- Update loop codegen and related tests to reference the named constant rather than an inline literal.
- Keep behavior identical after extraction.

### Step 3: Tighten typed line contracts
- Add typed AST exports for loop lines with optional literal argument and for stable compiler-directive forms where appropriate.
- Update compiler-side instruction implementations to use narrower line types where it improves clarity.
- Avoid reintroducing local argument-shape guards that should stay tokenizer-owned.

### Step 4: Audit directive-specific tokenizer helpers
- Determine whether `isSkipExecutionDirective.ts` and similar directive-specific helpers are still used in any meaningful parser flow.
- Remove them if they are dead or redundant.
- If they are still needed, document why and consolidate them under a clearer directive parsing surface.

### Step 5: Add focused regression coverage
- Keep tests around directive scope validation and idempotent context mutation.
- Add tests that make the new helper behavior explicit rather than indirectly relying on individual directive tests only.
- Verify tokenizer/parser tests still cover the authoritative directive parsing path.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "1000|#skipExecution|#initOnly|isSkipExecutionDirective|loopCap" packages/compiler`

## Success Criteria

- [ ] `#skipExecution` and `#initOnly` no longer duplicate the same directive plumbing.
- [ ] The default loop guard cap is represented by a named constant instead of an inline magic number in codegen.
- [ ] Compiler code uses narrower typed line contracts for `loop` and directive-shaped instructions where useful.
- [ ] Obsolete directive-specific tokenizer helpers are removed or clearly justified.
- [ ] The cleanup does not change existing directive or loop runtime behavior.

## Affected Components

- `packages/compiler/src/instructionCompilers/initOnly.ts` - current duplicated directive implementation
- `packages/compiler/src/instructionCompilers/skipExecution.ts` - current duplicated directive implementation
- `packages/compiler/src/instructionCompilers/loop.ts` - inline loop-cap constant in codegen
- `packages/compiler/src/instructionCompilers/` - shared directive helper location
- `packages/compiler/src/types.ts` - compiler-side line/context typing
- `packages/compiler/packages/tokenizer/src/types.ts` - tokenizer-side typed AST exports
- `packages/compiler/packages/tokenizer/src/syntax/` - directive helper audit and cleanup

## Risks & Considerations

- **Over-abstraction risk**: the helper should remove duplication without obscuring simple directive behavior.
- **Typing churn**: tightening line contracts can ripple into tests and helper utilities; keep the scope focused.
- **False dead-code removal**: directive-specific tokenizer helpers should be searched carefully before deletion.

## Related Items

- **Related**: `docs/todos/366-add-configurable-loop-cap-directive-and-loop-override.md`
- **Related**: `docs/todos/343-move-arity-and-raw-argument-shape-validation-into-tokenizer.md`
- **Related**: `docs/todos/345-tighten-tokenizer-to-compiler-contract-with-typed-ast-lines.md`

## Notes

- This cleanup was identified while scoping configurable loop-cap work.
- The main value is keeping the next compiler directive addition small and local instead of letting repeated plumbing spread further.
