---
title: 'Stack Config Schema Validation and Line-Mapped Errors'
created: 2025-12-01
status: Draft
---

# Stack Config Schema Validation and Line-Mapped Errors

Brainstorming notes for extending the stack-config-compiler with schema-aware validation, using JSON Schema as the contract while keeping error reporting tightly integrated with the VM and source lines.

This is **design only**; no implementation has been done yet.

## Goals

- Allow callers to provide a schema that describes the expected shape of the config produced by stack-config programs.
- Catch mistakes as early and precisely as possible:
  - Wrong types or invalid values when assigning (`set` / `append`).
  - Navigation into paths that aren’t allowed by the schema.
  - Missing required fields that were never written.
- Preserve good UX by attaching schema-related errors to meaningful source lines.
- Keep the stack-config language itself simple; schema is an optional layer on top.

## Schema Format

- Use **JSON Schema** as the source of truth for the config shape.
- For v1, keep array handling simple:
  - Distinguish “array vs not array”.
  - No `minItems` / `maxItems` / per-index rules initially.
- Support at least:
  - `type`: `string`, `number`, `boolean`, `null`, `object`, `array`.
  - `enum` for primitive values (e.g. `selectedRuntime` in `{0, 1, 2}`).
  - `properties` and `required` for object fields.
  - Basic control over whether extra keys are allowed via standard JSON Schema constructs.

The schema will likely live on the **host/app side** (editor/runtime) and be passed into the stack-config compiler as an option, e.g. `compileConfig(source, { schema })`.

## Where Validation Happens

### 1. Navigation Commands (`scope` / `rescope` / `rescopeTop`)

- Navigation commands validate **paths**, not values.
- When executing a navigation instruction:
  - The VM knows the current path and the next segment it wants to enter.
  - It can consult a schema-derived view to decide whether that segment is allowed under the current node.
- If the path segment doesn’t exist in the schema (an “unknown key” or invalid index), emit an immediate error:
  - Error is attached to the **line of the navigation instruction** (`scope`/`rescope`/`rescopeTop`).
  - This catches things like typos (`titel` vs `title`) at the point where the programmer navigates into the wrong field.

### 2. Value Commands (`set` / `append`)

- **All value correctness is checked at `set` / `append`**; this is the only place that enforces types and enums.
- On `set` / `append`:
  - The VM knows the current path (e.g. `projectInfo.title`, `runtimeSettings[0].sampleRate`).
  - It pops the value from the stack.
  - It looks up the schema node for that path and checks:
    - Type matches the schema’s `type`.
    - “Array vs not array” shape.
    - `enum` membership where applicable.
  - If the value doesn’t conform:
    - Emit an error attached to the **line of the `set` / `append` instruction**.
    - Include both the path and a clear message, e.g. `Expected number at "memorySizeBytes", got "string"`.
- The VM does **not** check value types at navigation commands; `scope` / `rescope` only care about whether the path segment exists.

### 3. Final Pass for Missing Required Fields

- After executing all commands, the VM has:
  - The resulting `config` JSON object (or `null` if there were fatal errors).
  - A record of which paths were written during execution.
- A post-execution validation pass walks the schema to find required fields that were **never written**:
  - For each required field that has no writes:
    - Emit a “missing required field” error.
    - Attach it to **line 1** of the program, per design decision.
    - Include the config path, e.g. `projectInfo.title`.
- Line 1 acts as a catch-all anchor for “global” omissions that can’t be tied to any particular command.

## “Unknown Key” Semantics

Definition of “unknown key” here: code attempts to navigate into or write to a property that doesn’t exist in the schema under that object/array.

Example:

```txt
scope "projectInfo"
  scope "titel" ; typo, schema only has "title" and "author"
  push "My Project"
  set
endScope
```

- Schema describes `projectInfo` with properties `title` and `author` only.
- The nested `scope "titel"` is a navigation into an **unknown key**.
- Behaviour:
  - Error is emitted **when executing `scope "titel"`**, not at `set`.
  - The error message can say something like:
    - `Unknown key "titel" under "projectInfo" (did you mean "title"?)` (exact wording TBD).

## Line Mapping Strategy

- **Navigation errors** (unknown keys/paths):
  - Reported at the line of the `scope` / `rescope` / `rescopeTop` command.

- **Value errors** (wrong type, invalid enum, etc.):
  - Reported at the line of the `set` / `append` command that commits the value.
  - We deliberately treat `set` / `append` as the place where the programmer says “use this value here”.

- **Missing required fields**:
  - After execution, for required schema paths that were never written:
    - Report errors at **line 1** of the program.
    - This provides a consistent anchor for global omissions and keeps the VM logic simple.

- Internally, the VM may still track a map of `path -> last write line` for other purposes, but the agreed external behaviour is:
  - Navigation failures: navigation line.
  - Value failures: `set`/`append` line.
  - Missing required: line 1.

## Arrays (v1)

- v1 keeps array handling deliberately simple:
  - Schema distinguishes only “this path is an array” vs “this path is not an array”.
  - No `minItems` / `maxItems` or index-specific rules initially.
- The VM treats writes under array paths according to the existing stack-config semantics (e.g. `runtimeSettings[0]` vs `runtimeSettings`), with schema just validating:
  - That an array is expected at that path.
  - That items have the right basic type/enum if specified.

## Enum-Like Constraints

- Enum-style constraints (e.g. `selectedRuntime` must be one of `[0, 1, 2]`) are expressed directly via JSON Schema `enum`.
- Enforcement:
  - Happens at `set` / `append`, same as type checks.
  - Violations are reported as value errors on the `set`/`append` line.

## Open Implementation Details (For Future TODO)

The following details are intentionally left at the “design sketch” level for now:

- Exact JSON Schema draft and which subset is supported in v1.
- The internal representation of a “VM-friendly view” of the schema:
  - Likely a tree keyed by path segments, derived from JSON Schema.
  - Nodes store type, enum, required children, and “is array” flag.
- How strictly to support/interpret `additionalProperties` for extra keys.
- Exact error shape on the public API:
  - e.g. `kind: 'parse' | 'exec' | 'schema'`, plus `path` and `line`.
- Whether to provide helper APIs for precompiling the schema into a VM-ready form.

These can be refined and formalised in a dedicated TODO document (e.g. a future `stack-config-schema-validation` TODO) once we are ready to implement.

