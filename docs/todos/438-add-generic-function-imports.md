---
title: 'TODO: Add generic function imports'
priority: Medium
effort: 1-2d
created: 2026-05-29
issue: null
status: Open
completed: null
---

# TODO: Add generic function imports

## Problem Description

The compiler currently has special-purpose host-call behavior for built-in features, but the language does not have a generic way to declare WebAssembly function imports. This keeps host integration coupled to individual compiler instructions instead of letting ordinary 8f4e functions describe their imported ABI and participate in normal `call` resolution.

The goal of this TODO is only to add generic imported functions. Higher-level utility functions that use imports should be handled separately.

## Proposed Solution

Allow a function block to declare that it is implemented by the host:

```8f4e
function hostLog
#import env log
param int value
functionEnd
```

Imported functions should be normal callable function symbols from the compiler's perspective. They have parameters, return values, a WebAssembly type index, and a WebAssembly function index, but they do not emit a local function body.

## Design Decisions

- `#import <module> <name>` is a function-level compiler directive.
- Imported functions use the existing `function` / `param` / `functionEnd` shape to define their signature.
- Imported functions are callable through the existing `call` instruction.
- Imported functions are implicitly impure.
- Imported functions do not emit entries in the WebAssembly function section or code section.
- Imported functions are emitted in the WebAssembly import section before defined functions.
- Defined function indexes must be offset by the number of imported functions.
- `#import` and `#export` are mutually exclusive for now.
- Imported function bodies are invalid. The block may contain only function directives, `param` lines, and `functionEnd`.

## Anti-Patterns

- Do not add instruction-specific import paths for each host feature.
- Do not make `call` branch on imported versus local functions unless the existing resolved function metadata is insufficient.
- Do not emit empty WebAssembly function bodies for imported functions.
- Do not include assertion-specific behavior in this TODO.

## Implementation Plan

### Step 1: Add syntax and AST support

- Add `#import` to function compiler directives.
- Add a typed AST line for the import directive.
- Validate the directive argument shape.
- Decide whether import module/name arguments accept identifiers only or identifiers plus string literals.

### Step 2: Extend function metadata

- Add optional import metadata to function collection and compiled function types.
- Preserve existing signature collection for params and returns.
- Mark imported functions as having no local body.
- Treat imported functions as impure during purity checks.

### Step 3: Generate correct WebAssembly imports and indexes

- Emit imported functions through the existing function import utility.
- Assign imported function indexes before defined function indexes.
- Offset defined function indexes by the import count.
- Ensure function and code sections only contain defined functions.
- Keep `call` using the resolved target function's WebAssembly index.

### Step 4: Add semantic validation

- Reject imported functions with executable body instructions.
- Reject `#import` combined with `#export`.
- Reject duplicate import directives in one function.
- Confirm duplicate function-name handling still follows the compiler's function uniqueness rules.

### Step 5: Cover with tests

- Compile a module that calls a void imported function.
- Compile a module that calls an imported function with a return value.
- Verify mixed imported and defined function indexes.
- Verify imported functions are present in the import section and absent from function/code sections.
- Verify invalid imported function bodies and import/export conflicts produce compiler errors.
- Add a runtime instantiation test with a provided host import.

## Validation Checkpoints

- `npx nx run @8f4e/tokenizer:test`
- `npx nx run @8f4e/compiler:test`
- `npx nx run-many --target=typecheck --all`

## Success Criteria

- [ ] 8f4e source can declare imported functions with `#import`.
- [ ] Imported functions can be called through normal `call` resolution.
- [ ] Imported function parameters and returns participate in stack typing.
- [ ] WebAssembly import/function/code sections are emitted with correct function indexes.
- [ ] Invalid imported function shapes produce explicit compiler errors.
- [ ] Existing local function behavior remains covered by tests.

## Affected Components

- `packages/compiler/packages/tokenizer` - Import directive parsing and syntax validation.
- `packages/compiler-spec` - AST and compiled function metadata types.
- `packages/compiler/src` - Function collection, semantic validation, WebAssembly import emission, and function index assignment.
- `packages/compiler/packages/wasm-utils` - Existing function import utility usage may need small type adjustments.
- `docs` - Language documentation for imported functions.

## Risks & Considerations

- **Function index ordering**: WebAssembly imports occupy function indexes before local function definitions, so local function index assignment must be audited carefully.
- **Purity semantics**: Imported functions should be conservative and treated as impure unless the language later grows an explicit pure-import marker.
- **Directive argument shape**: Host import names may eventually need characters outside normal identifiers. String literal support should be considered before the syntax is locked in.
- **Breaking changes**: The project is unreleased, so compatibility shims are not required.

## Related Items

- **Related**: [TODO 437: Add execution groups](./437-add-execution-groups.md)
- **Related**: [TODO 435: Add polymorphic function overloads](./435-add-polymorphic-function-overloads.md)

## Notes

- This TODO intentionally excludes replacing any existing instruction with a utility function. It only records the generic function import feature.
