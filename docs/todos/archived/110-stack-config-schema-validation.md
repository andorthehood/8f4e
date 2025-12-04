---
title: 'TODO: Add JSON Schema-Based Validation to stack-config-compiler'
priority: Medium
effort: 2–3d
created: 2025-12-01
status: Completed
completed: 2025-12-01
---

# TODO: Add JSON Schema-Based Validation to stack-config-compiler

## Problem Description

The stack-config-compiler currently validates only syntax and basic runtime constraints (e.g. stack underflow, malformed paths). There is no way to express or enforce a higher-level schema for the resulting JSON config object, which leads to several issues:

- What is the current state?
  - Config programs can freely create arbitrary object shapes and values.
  - Typos in keys (e.g. `titel` vs `title`) are not caught by the compiler.
  - Type mismatches (e.g. pushing a string into a field that is semantically a number) are not detected.
  - Missing fields that are conceptually required by the editor/runtime are only discovered later, if at all.
- Why is this a problem?
  - Config authors get late or no feedback when they violate the expected config structure.
  - The editor/runtime must defensively check config at use time, rather than relying on compiler guarantees.
  - It is hard to evolve config blocks towards a well-defined contract without schema-level validation.
- What impact does it have?
  - Hard-to-debug runtime errors or subtle misbehaviour when config is malformed.
  - Increased friction for users writing config blocks, as mistakes aren’t surfaced at the right place/line.
  - Risk of incompatible configs as the system grows and more fields are added.

## Proposed Solution

Extend the stack-config-compiler to accept an optional JSON Schema describing the expected config shape, and perform schema-aware validation integrated directly into the VM execution step, with precise line mapping.

High-level behaviour:

- The public API gains an option to pass a JSON Schema (or schema-like object) into `compileConfig`.
- The compiler will:
  1. Parse and execute the stack-config program as it does today to produce a JSON `config`.
  2. During execution, consult a schema-derived view to:
     - Validate navigation into scopes (`scope` / `rescope` / `rescopeTop`) against allowed keys/paths.
     - Validate values at `set` / `append` against the schema (types, array vs non-array, enums).
  3. After execution, perform a final pass over the schema to detect missing required fields that were never written.
- Errors are enriched with:
  - `kind` distinguishing schema errors from parse/exec errors.
  - A `path` (e.g. `projectInfo.title`).
  - A `line` number chosen according to agreed rules:
    - Navigation errors: line of the navigation command.
    - Value errors: line of the `set` / `append` command.
    - Missing required fields: line `1`.

Design constraints (from brainstorming):

- Schema format: JSON Schema is the source of truth (at least for basic `type`, `enum`, `properties`, `required`, and array vs non-array).
- Validation is **VM-level**, not a separate JSON-only pass with no line context.
- Value correctness is only checked at `set` / `append`.
- Navigation commands validate paths but not values.
- Missing required fields are reported after execution, anchored at line 1.

See `docs/brainstorming_notes/014-stack-config-schema-validation.md` for detailed design notes.

## Implementation Plan

### Step 1: Extend compileConfig API to accept a schema option

- Add an optional `schema` parameter to the stack-config-compiler entry point:
  - e.g. `compileConfig(source: string, options?: { schema?: JSONSchemaLike }): CompileResult`.
  - Ensure the new parameter is backwards compatible (callers can ignore it).
- Introduce or reuse a `JSONSchemaLike` type that captures the subset of JSON Schema v1 will support (types, enums, properties, required, arrays).
- Expected outcome:
  - Callers (e.g. app shell / editor) can pass a schema into the compiler without changing existing call sites.
- Dependencies:
  - Clarified schema subset in the brainstorming note.

### Step 2: Preprocess JSON Schema into a VM-friendly structure

- Implement a small schema preprocessor that:
  - Accepts a JSON Schema object and produces an internal tree keyed by path segments.
  - Each node should expose:
    - Expected `type` (`string`, `number`, `boolean`, `null`, `object`, `array`).
    - Whether the node represents an array vs non-array.
    - Optional `enum` for allowed primitive values.
    - Allowed child properties and their required list (for objects).
  - This preprocessed schema is passed into/accessible from the VM.
- Keep the preprocessor strict but minimal:
  - Fail early if the schema is structurally incompatible with the supported subset.
- Expected outcome:
  - A lightweight, VM-oriented schema view that makes path and value checks straightforward.
- Dependencies:
  - Step 1 (schema option in API).

### Step 3: Add schema-aware navigation validation in the VM

- Update VM navigation commands (`scope`, `rescope`, `rescopeTop`) to consult the schema view:
  - When moving into a new segment (e.g. `"projectInfo"` → `"title"`), check whether that property or array item is allowed at this path.
  - If the segment does not exist in the schema under the current node:
    - Emit a schema error at the navigation command’s line.
    - Include the attempted path and a clear message (“unknown key” or invalid path).
- This is where “unknown keys” (e.g. `titel` typo) are detected.
- Expected outcome:
  - Invalid paths are caught immediately at navigation time instead of silently creating unexpected JSON structure.
- Dependencies:
  - Step 2 (VM-friendly schema).

### Step 4: Add schema-aware value validation at set / append

- Extend VM handling for `set` and `append` to enforce value-level schema rules:
  - For each `set` / `append`:
    - Determine the current config path (e.g. `projectInfo.title`).
    - Pop the value from the stack.
    - Look up the schema node for that path.
    - Validate:
      - Basic `type` match.
      - That the path is array vs non-array as expected.
      - Any `enum` constraint on the node (e.g. `selectedRuntime` in `[0, 1, 2]`).
  - On violation:
    - Emit a schema error attached to the **line of the `set` / `append` command**.
    - Include both path and an informative message (“expected number, got string”, “value not in enum”, etc.).
- This is the only place where value correctness is checked; navigation remains path-only.
- Expected outcome:
  - Type and enum mismatches are surfaced exactly where values are committed into the JSON config.
- Dependencies:
  - Step 2 (schema view), Step 3 (path resolution).

### Step 5: Post-execution pass for missing required fields

- After VM execution (and assuming no early fatal errors), perform a final schema pass:
  - Traverse the schema tree and determine which required fields are expected.
  - Track which paths were written during execution (e.g. via a `writtenPaths` map or set).
  - For each required field that has **no writes**:
    - Emit a schema error with:
      - `path` of the missing field.
      - `line = 1` (by design, missing required is anchored to the first line).
      - A message such as `Missing required field "projectInfo.title"`.
- Expected outcome:
  - Programs that fail to provide required config fields are rejected with clear, global errors.
- Dependencies:
  - Step 4 (tracking written paths alongside value checks).

### Step 6: Extend error types and tests

- Update `CompileError` / `CompileResult` types to:
  - Distinguish schema errors from parse/runtime errors (e.g. `kind: 'parse' | 'exec' | 'schema'`).
  - Include optional `path` information for schema-related errors.
  - Ensure `line` is present or omitted according to the rules above.
- Add tests covering at least:
  - Unknown key at navigation (`scope "titel"` under a schema that only knows `title`).
  - Type mismatch at `set` / `append`.
  - Enum violation.
  - Missing required field (line reported as 1).
  - Valid config that fully conforms to the schema (no schema errors).
- Expected outcome:
  - Schema validation behaviour is locked in and guarded by tests.
- Dependencies:
  - Steps 3–5 (validation behaviour).

### Step 7: Documentation and examples

- Update `packages/stack-config-compiler/README.md` to:
  - Document the new schema option on `compileConfig`.
  - Describe the validation behaviour and error mapping semantics.
  - Provide a small end-to-end example (schema + config program + resulting JSON + example error).
- Optionally, add a dedicated doc (or extend existing notes) showing how editor/runtime code can define schemas for config blocks.
- Expected outcome:
  - Consumers of stack-config-compiler understand how to define and pass schemas, and what errors to expect.
- Dependencies:
  - All previous steps.

## Success Criteria

- [x] `compileConfig` accepts an optional JSON Schema (or schema-like) parameter without breaking existing callers.
- [x] Navigation into paths not defined in the schema (unknown keys) produces clear errors at the navigation instruction line.
- [x] Assigning values at `set` / `append` that violate schema-defined types or enums produces clear, line-mapped schema errors.
- [x] Required fields defined in the schema that are never written by the program produce “missing required field” errors anchored at line 1.
- [x] Schema-related errors are clearly distinguishable from parse and runtime errors via error kind and include both path and line where applicable.
- [x] Tests cover navigation errors, value errors, missing required fields, and fully valid configs.
- [x] Documentation for stack-config-compiler is updated to describe schema validation and how to integrate it.

## Affected Components

- `packages/stack-config-compiler/src/index.ts`
  - Extend `compileConfig` signature to accept schema options.
  - Wire schema preprocessing and VM integration.
- `packages/stack-config-compiler/src/types.ts`
  - Extend `CompileResult` / `CompileError` with schema-related variants and path information.
  - Add a `JSONSchemaLike` type (or import one) representing the supported subset.
- `packages/stack-config-compiler/src/schema.ts` (new)
  - Preprocess JSON Schema into a VM-friendly tree structure.
- `packages/stack-config-compiler/src/vm.ts`
  - Integrate schema-aware navigation validation.
  - Integrate schema-aware value checks at `set` / `append`.
  - Track written paths for missing required detection.
- `packages/stack-config-compiler/tests/` (or inline tests in `src/index.ts`)
  - Add tests for schema validation behaviour and line mapping.
- `packages/stack-config-compiler/README.md`
  - Document schema support and provide examples.
- `docs/brainstorming_notes/014-stack-config-schema-validation.md`
  - Reference document for design details (kept in sync as needed).

## Risks & Considerations

- **Risk 1: Schema complexity vs supported subset**
  - JSON Schema is large; v1 will only support a subset (types, arrays vs non-arrays, enums, `properties`, `required`).
  - Mitigation: Clearly document the supported subset and fail fast on unsupported features during schema preprocessing.
- **Risk 2: Error semantics drift**
  - As schema support grows, error kinds and line mapping rules could become inconsistent.
  - Mitigation: Centralise schema error construction logic and codify line/path rules in tests.
- **Dependencies**:
  - Stable VM path representation and config-building semantics in stack-config-compiler.
  - Agreement on the JSON Schema subset to support and how to evolve it.
- **Breaking Changes**:
  - None expected for existing callers that do not pass a schema.
  - For callers that do pass a schema, malformed configs will now produce schema errors instead of silently generating unexpected JSON, which is a desirable behavioural change.

## Related Items

- **Related**:
  - `docs/brainstorming_notes/014-stack-config-schema-validation.md` — detailed design notes for schema validation and line mapping.
  - `docs/todos/107-stack-config-compiler-package.md` — foundational work for the stack-config-compiler package.
  - `docs/todos/108-config-and-module-blocks-integration.md` — integration of stack-config-compiled JSON into editor state.
  - `docs/todos/109-stack-config-concat-instruction.md` — related extension to stack-config language capabilities.

## References

- `packages/stack-config-compiler/src/index.ts` — current `compileConfig` entry point and comprehensive example.
- `docs/brainstorming_notes/013-stack-oriented-config-language.md` — original design for the stack-oriented config language.
- `docs/brainstorming_notes/014-stack-config-schema-validation.md` — this feature’s brainstorming document.

## Notes

- Initial implementation should keep the schema subset and validation logic small and focused; it can be expanded in future TODOs as needs arise.
- Schema support is optional: callers who do not pass a schema should see no behavioural change aside from any incidental refactors.

