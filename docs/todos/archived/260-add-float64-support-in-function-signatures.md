---
title: 'TODO: Add float64 support in function signatures'
priority: Medium
effort: 1-2d
created: 2026-02-20
status: Completed
completed: 2026-02-20
---

# TODO: Add float64 support in function signatures

## Problem Description

Function parameter and return typing still accepts only `int` and `float` (float32).

Current constraints:
- `param` rejects `float64`
- `functionEnd` return type parsing rejects `float64`
- `FunctionSignature` type is `Array<'int' | 'float'>`

This blocks float64 values from crossing function boundaries even if float64 stack/memory support exists elsewhere.

## Proposed Solution

Extend function signature support to include `float64` in:
- `param` instruction
- `functionEnd` return type parsing
- internal `FunctionSignature` typing and wasm type generation

Core behavior:
- `int` -> `i32`
- `float` -> `f32`
- `float64` -> `f64`

## Anti-Patterns

- Do not overload `float` to mean “sometimes float32, sometimes float64”.
- Do not accept `float64` in parser but still map it to `f32` in function type registry.
- Do not change existing `int`/`float` behavior.

## Implementation Plan

### Step 1: Extend signature and parser-level typing
- Update `FunctionSignature` unions to include `float64`.
- Update `param` validation to accept `float64`.
- Update `functionEnd` return parsing to accept `float64`.

### Step 2: Update wasm type mapping
- Update function type generation (`params` and `results`) to map `float64` -> `Type.F64`.
- Ensure signature-map keys remain stable and distinct across `float` vs `float64`.

### Step 3: Add tests
- Add/extend tests for:
  - `param float64 x` accepted and tracked in function signature
  - `functionEnd float64` accepted
  - mixed signatures (`int`, `float`, `float64`) map correctly to wasm function types
  - invalid types still rejected

## Validation Checkpoints

- `rg -n "FunctionSignature|param|functionEnd|Type\\.F32|Type\\.F64" /Users/andorpolgar/git/8f4e/packages/compiler/src`
- `npx nx run @8f4e/compiler:test -- --run "param|functionEnd|function|signature"`

## Success Criteria

- [ ] `param` accepts `float64` and records correct local/signature metadata.
- [ ] `functionEnd` accepts `float64` return types.
- [ ] Function type registry emits `Type.F64` for float64 params/returns.
- [ ] Existing `int`/`float` behavior remains unchanged.

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/types.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/param.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/functionEnd.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/compiler.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests`

## Risks & Considerations

- **Risk 1**: Signature collisions if mapping logic does not distinguish float32/float64.
  - Mitigation: include explicit `Type.F64` in signature serialization.
- **Risk 2**: Local metadata drift for float64 params.
  - Mitigation: add assertions for both signature and local flags in tests.

## Related Items

- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/250-add-f64-push-support.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/253-add-f64-support-for-basic-arithmetic.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/252-add-float-promote-demote-instructions.md`

## Notes

- Function signature support is foundational for reusable float64 helpers and should be completed before broad function-level float64 examples.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
