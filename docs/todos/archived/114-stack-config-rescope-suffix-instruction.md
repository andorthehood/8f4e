---
title: 'TODO: Add rescopeSuffix instruction to stack-config-compiler'
priority: Medium
effort: 4-6 hours
created: 2025-12-06
status: Completed
completed: 2025-12-05
---

# TODO: Add rescopeSuffix instruction to stack-config-compiler

## Problem Description

The stack-config language currently provides these scope-manipulation commands:
- `scope <path>`: push one or more path segments onto the scope stack.
- `rescopeTop <path>`: replace the top scope segment with one or more new segments.
- `rescope <path>`: replace the entire scope with a new one.

There is no instruction that can replace the trailing suffix of the current scope with a new suffix of the same length, based on how many segments are passed. This makes some useful refactor-style operations awkward or verbose. For example, transforming:
- `icons.piano.title` → `icons.harp.title`
- `settings.runtime[0].config` → `settings.runtime[1].config`

is either done by a full `rescope` (which discards useful prefix context) or multiple `popScope`/`scope` calls. A dedicated suffix-rescoping instruction would improve readability and composability for stack-config programs that manipulate related scopes.

## Proposed Solution

Add a new `rescopeSuffix <path>` instruction to the stack-config-compiler with the following semantics:

- Parse `<path>` into segments using the existing path parsing rules:
  - Dot-delimited object keys and bracketed indices: e.g. `"foo.bar[0].baz"` → `['foo', 'bar', '[0]', 'baz']`.
- Let `n = segments.length`.
- At execution time:
  - Require `scopeStack.length >= n` (otherwise produce an exec error).
  - Pop the last `n` segments from `scopeStack`.
  - Push all segments from `<path>` (with schema-aware navigation errors reported in the same way as `scope` / `rescopeTop`).
- Result: the trailing suffix of the current scope is replaced with the new suffix, preserving the unchanged prefix.

Examples:

- `scope "icons.piano.title"`  
  `rescopeSuffix "harp.title"`  
  → `scopeStack` changes from `['icons', 'piano', 'title']` to `['icons', 'harp', 'title']`.

- `scope "settings.runtime[0].config"`  
  `rescopeSuffix "runtime[1].config"`  
  → `scopeStack` changes from `['settings', 'runtime', '[0]', 'config']` to `['settings', 'runtime', '[1]', 'config']`.

Schema-aware navigation should mirror the existing behaviour of `scope` / `rescopeTop`:
- Navigation errors are reported at the line of the `rescopeSuffix` command.
- The underlying `scopeStack` is still updated, even when schema navigation reports an unknown key, to keep execution semantics orthogonal to validation.

## Implementation Plan

### Step 1: Extend command types and parser
- Add a new `rescopeSuffix` entry to the `CommandType` union in `packages/stack-config-compiler/src/types.ts`.
- Update parser command validation so `rescopeSuffix` is a recognised command:
  - `parseLine` should treat it like `scope` / `rescopeTop` / `rescope`, requiring a path argument.
  - Ensure `parsePathArgument` is reused so array indices and escapes are handled consistently.
- Add unit tests in `packages/stack-config-compiler/src/parser/parseLine.ts` to cover:
  - Basic parsing of `rescopeSuffix "foo.bar"`.
  - Error on missing argument.
  - Handling of comments and string escapes.

### Step 2: Implement VM behaviour
- Add a new command handler in `packages/stack-config-compiler/src/commands/rescopeSuffix.ts`:
  - Validate that `scopeStack.length >= segments.length`; if not, return an exec error like `Cannot rescopeSuffix: scope stack has fewer segments than provided suffix`.
  - Pop `segments.length` entries from `state.scopeStack`.
  - Use `validateAndPushSegments` to push the new segments (so schema validation is applied consistently).
- Wire the new handler into `packages/stack-config-compiler/src/commands/index.ts` and `packages/stack-config-compiler/src/vm/executeCommand.ts`.
- Add focused tests for the VM behaviour:
  - Successful suffix replacement with and without schema.
  - Error when `scopeStack` is shorter than the suffix length.
  - Mixed object/array paths (e.g. `['foo', '[0]', 'bar']`).

### Step 3: Update higher-level tests and documentation
- Extend the comprehensive example in `packages/stack-config-compiler/src/index.ts` (or add a new test block) to exercise `rescopeSuffix` in a realistic config program.
- Update `packages/stack-config-compiler/README.md`:
  - Add `rescopeSuffix` to the command table.
  - Provide a short example illustrating suffix replacement.
- Update `docs/brainstorming_notes/013-stack-oriented-config-language.md`:
  - Document `rescopeSuffix` under the scope commands section, with its suffix-replacement semantics and error conditions.

## Success Criteria

- [ ] `rescopeSuffix` is recognised by the parser, with correct path argument parsing.
- [ ] VM execution replaces exactly `segments.length` trailing scope segments and errors when the scope is too shallow.
- [ ] Schema navigation for `rescopeSuffix` matches existing navigation error behaviour for `scope` / `rescopeTop`.
- [ ] The comprehensive example and README include at least one `rescopeSuffix` usage.
- [ ] All existing tests still pass, and new tests cover the new instruction’s behaviour.

## Affected Components

- `packages/stack-config-compiler/src/types.ts` — add `rescopeSuffix` to `CommandType`.
- `packages/stack-config-compiler/src/parser/parseLine.ts` — recognise and parse `rescopeSuffix` with path arguments.
- `packages/stack-config-compiler/src/commands/rescopeSuffix.ts` — new command implementation.
- `packages/stack-config-compiler/src/commands/index.ts` — export the new command handler.
- `packages/stack-config-compiler/src/vm/executeCommand.ts` — dispatch `rescopeSuffix` to its handler.
- `packages/stack-config-compiler/src/index.ts` — update tests/examples to include `rescopeSuffix`.
- `packages/stack-config-compiler/README.md` — document the new instruction.
- `docs/brainstorming_notes/013-stack-oriented-config-language.md` — language-level documentation for `rescopeSuffix`.

## Risks & Considerations

- **Risk 1**: Semantic confusion between `rescopeTop` and `rescopeSuffix`.  
  - Mitigation: Keep `rescopeTop` semantics unchanged (always pop exactly one segment) and clearly document that `rescopeSuffix` replaces a suffix whose length equals the number of segments in the argument.
- **Risk 2**: Backwards-compatibility with existing config programs.  
  - Mitigation: `rescopeSuffix` is additive; no existing instructions are removed or changed.
- **Dependencies**: Existing path parsing and schema navigation infrastructure in `stack-config-compiler`.
- **Breaking Changes**: None expected, as this is a new instruction with no change to current command semantics.

## Related Items

- **Related**: `docs/todos/archived/107-stack-config-compiler-package.md` — foundational stack-config-compiler work.
- **Related**: `docs/todos/archived/110-stack-config-schema-validation.md` — schema-aware navigation and validation that `rescopeSuffix` should leverage.
- **Related**: `docs/todos/archived/109-stack-config-concat-instruction.md` — prior work adding new instructions to stack-config-compiler.

## References

- `docs/brainstorming_notes/013-stack-oriented-config-language.md` — current stack config language spec.
- `packages/stack-config-compiler/README.md` — stack-config-compiler usage and command list.
- `packages/stack-config-compiler/src/index.ts` — compile entry point and comprehensive example.

## Notes

- Naming: `rescopeSuffix` is chosen to emphasise that only the trailing suffix of the scope is replaced, preserving any unchanged prefix.
- Implementation can follow existing patterns used for `rescopeTop`, reusing shared helpers such as `validateAndPushSegments`.
- Consider adding a small ASCII diagram in the README showing scopeStack before/after `rescopeSuffix` for clarity.

