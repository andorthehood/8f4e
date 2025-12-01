---
title: 'TODO: Add concat instruction to stack-config-compiler'
priority: Low
effort: 2–4h
created: 2025-12-01
status: Completed
completed: 2025-12-01
---

# TODO: Add concat instruction to stack-config-compiler

## Problem Description

The stack-config language currently has no built-in way to concatenate string values on the stack. This makes it hard to build derived strings (for example, combining a base path with a suffix or assembling human-readable messages) without pushing fully pre-composed strings from the host.

- Current state:
  - `push` supports string literals, and commands like `set` / `append` work with those values.
  - There is no `concat`-style instruction in the parser or VM.
  - Example programs that need concatenation must either:
    - Duplicate logic in multiple `push` instructions, or
    - Rely on the host to pre-compose strings before pushing them.
- Why this is a problem:
  - Reduces expressiveness of the stack-config language for simple string manipulation.
  - Forces boilerplate and duplication in config programs.
  - Makes it harder to evolve config to build more dynamic paths or messages over time.

## Proposed Solution

Add a `concat` instruction to the stack-config-compiler that operates on all current values in the execution stack and produces a concatenated string result.

- High-level semantics:
  - Program example:
    - `push "foo"`
    - `push "bar"`
    - `concat`
  - Stack behaviour:
    - Takes all values currently on the stack (from bottom to top), converts each to a string via `String(value)`, and concatenates them.
    - Replaces the entire previous stack with a single value containing the concatenated string (for the example above: `"foobar"`).
- Design notes:
  - `concat` is a pure stack operation: it never calls or implies `set` / `append`, it only replaces the stack contents with a single concatenated value.

## Implementation Plan

### Step 1: Extend command types with concat
- Add a `concat` command type to the stack-config-compiler command/type definitions.
- Ensure `CommandType` (and any discriminated unions) includes `'concat'`.
- Expected outcome: Type-level support for `concat` across the compiler.
- Dependencies: Existing `Command` / `CommandType` definitions in `packages/stack-config-compiler/src/types.ts`.

### Step 2: Update parser to recognize concat
- Extend the parser so that a line containing `concat` (ignoring leading/trailing whitespace and comments) produces a `concat` command.
- Reuse existing parsing patterns for simple no-operand commands like `set` or `append`.
- Expected outcome: Valid source programs containing `concat` produce the correct command sequence.
- Dependencies: Step 1 (new command type).

### Step 3: Implement concat in VM execution
- Add handling for the `concat` command in `executeCommands`:
  - If the stack is empty, report a stack underflow error.
  - Otherwise, read all current values from the stack (bottom to top), convert each to a string via `String(value)`, and join them into a single string.
  - Replace the entire stack with a single element containing the concatenated string.
- Ensure error cases (e.g. empty stack) are reported via `errors` with appropriate line information.
- Expected outcome: `concat` behaves as a pure stack operation and integrates with the existing error-reporting model, using `String(value)` coercion for non-string operands.
- Dependencies: Steps 1–2.

### Step 4: Add tests and example coverage
- Extend the comprehensive example test in `packages/stack-config-compiler/src/index.ts` (or a dedicated test file) to include at least one `concat` usage:
  - Minimal example:
    - `push "foo"`
    - `push "bar"`
    - `concat`
    - `set`
  - Validate the resulting JSON value is `"foobar"` in the appropriate scope.
- Add tests for:
  - Concatenating three or more values (e.g. `push "foo"`, `push "bar"`, `push 123`, `concat` → `"foobar123"`).
  - Error behaviour on empty or single-element stack.
  - Coercion behaviour for non-string operands (numbers, booleans, null, etc.) using `String(value)`.
- Expected outcome: `concat` semantics are locked in via tests and snapshots.
- Dependencies: Steps 1–3 (implementation).

### Step 5: Update documentation and language notes
- Update relevant documentation references to include `concat`:
  - `packages/stack-config-compiler/README.md` command list and examples.
  - Any brainstorming or language description docs (for example, stack-oriented config language notes) that describe available instructions.
- Expected outcome: Users of the stack-config language can discover and understand `concat` through docs and examples.
- Dependencies: Steps 1–4 (finalised semantics).

## Success Criteria

- [x] Source programs using `push "foo"`, `push "bar"`, `concat`, `set` compile successfully and produce `"foobar"` in the resulting JSON.
- [x] `concat` is recognized by the parser and appears in the command stream with correct line information.
- [x] Executing `concat` on an empty stack produces a clear, actionable error in `errors`.
- [x] Behaviour for non-string operands (coercion via `String(value)`) is covered by tests.
- [x] `concat` is documented in the stack-config-compiler README and any relevant language docs.

## Affected Components

- `packages/stack-config-compiler/src/types.ts`
  - Add `concat` to command types.
- `packages/stack-config-compiler/src/parser.ts`
  - Parse `concat` lines into appropriate command objects.
- `packages/stack-config-compiler/src/vm.ts`
  - Implement runtime execution semantics for `concat`.
- `packages/stack-config-compiler/src/index.ts`
  - Extend example/inline tests to cover `concat`.
- `packages/stack-config-compiler/README.md`
  - Document the new instruction and provide usage examples.
- `docs/brainstorming_notes/013-stack-oriented-config-language.md` (if applicable)
  - Update instruction list and examples to include `concat`.

## Risks & Considerations

- **Risk 1**: Interaction with future string operations.
  - Mitigation: Keep `concat` semantics minimal and composable so future string ops (e.g. substring, formatting helpers) can be layered on top without breaking existing programs.
- **Dependencies**: Stable stack-config-compiler command/VM architecture; existing error-reporting patterns for stack underflow/type errors.
- **Breaking Changes**: None expected; `concat` is additive and should not affect existing programs.

## Related Items

- **Related**:
  - `docs/todos/107-stack-config-compiler-package.md` — foundational work for the stack-config-compiler package.
  - `docs/todos/108-config-and-module-blocks-integration.md` — integration of stack-config-compiled JSON into editor state.

## References

- `packages/stack-config-compiler/src/index.ts` — current compile entry point and comprehensive example.
- `docs/brainstorming_notes/013-stack-oriented-config-language.md` — original design notes for stack-based config language.

## Notes

- Keep the initial implementation small and focused: a single binary `concat` instruction is sufficient to unblock basic string composition use cases.
- If future needs emerge (e.g. templating, interpolation), they can build on top of this primitive rather than overloading its behaviour.
