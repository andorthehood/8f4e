---
title: 'TODO: Add polymorphic function overloads'
priority: Medium
effort: 1-2d
created: 2026-05-29
issue: null
status: Open
completed: null
---

# TODO: Add polymorphic function overloads

## Problem Description

8f4e functions are currently identified by their source-level function name. This prevents users from defining multiple concrete versions of the same operation for different value or pointer types.

Current state:
- `function <name>` must be globally unique.
- `call <name>` resolves directly to one collected function metadata entry.
- Users must create differently named functions for type variants, such as `wrapFloatPointer` and `wrapIntPointer`.

Why this is a problem:
- reusable helper functions become noisier as pointer and scalar type coverage grows
- generic functions need overload resolution as a foundation
- the source-level callable name and the compiler-level unique function identity are currently conflated

## Proposed Solution

Add source-level function polymorphism by allowing multiple functions to share a user-facing name when their parameter signatures differ.

Use a signature-derived function `id` as the compiler's canonical unique identity. Keep the user-written function name as separate metadata.

Example compiled identities:

```text
tick__void
square__int
mix__float__float
wrapPointer__float_p__float_p__int
wrapPointer__int_p__int_p__int
deref__float_pp
```

Identity rules:
- `name` is the source-level callable name used by `function` and `call`.
- `id` is the unique compiler identity and is always derived from `name` plus encoded parameter types.
- `__void` is used for zero-parameter functions.
- return types are not part of overload identity.
- compiled function output should expose both `id` and `name`.

Overload rules:
- overload resolution is exact match only.
- user code calls by source `name`, not generated `id`.
- functions are global.
- overload sets with the same `name` must all have the same positive arity.
- zero-parameter function names can only have one implementation.
- duplicate `name + parameter signature` is an error, even when return types differ.
- overloaded functions cannot be exported yet; use a uniquely named wrapper function for exported entry points.
- pointer overloads require pointer type metadata; unknown integer addresses must not guess a pointer overload.

## Anti-Patterns

- Do not use return types to distinguish overloads.
- Do not allow implicit scalar conversions during overload resolution.
- Do not let user source code depend on generated ids for normal calls.
- Do not pick an arbitrary overload when pointer provenance is missing or ambiguous.
- Do not special-case non-overloaded functions so they keep old ids; every function should follow the same id convention.

## Implementation Plan

### Step 1: Split source function name from unique function id
- Add source-level function name metadata to `FunctionAST`, `FunctionMetadata`, and `CompiledFunction`.
- Generate function ids with a shared helper such as `createFunctionId(name, parameters)`.
- Encode pointer types with identifier-safe suffixes such as `float_p` and `float_pp`.
- Use `name__void` for zero-parameter functions.

### Step 2: Collect function overload sets
- Replace the function metadata lookup keyed only by source name with overload-aware storage.
- Permit duplicate source names when the parameter signatures differ.
- Reject duplicate `name + parameter signature`.
- Reject overload sets whose members have different parameter counts.
- Reject overload sets with zero parameters.

### Step 3: Resolve calls by stack operand types
- Change call normalization so `call <name>` resolves to an overload set by source name.
- During stack analysis, inspect the stack operands for the call's arity and exact parameter types.
- Attach the selected concrete target function metadata to the analyzed call line.
- Emit clear errors for no match, multiple matches, insufficient operands, or missing pointer metadata.

### Step 4: Keep codegen concrete
- Keep the `call` instruction compiler using `targetFunction.wasmIndex`.
- Keep function type registration and Wasm lowering working on concrete selected function metadata.
- Ensure compiled function arrays, type sections, function sections, exports, and code sections use signature-derived ids consistently.

### Step 5: Reject overloaded function exports
- Reject `#export` on any function that belongs to an overload set.
- Continue rejecting duplicate export names and built-in export-name collisions for non-overloaded functions.
- Document that exported entry points should use uniquely named wrapper functions when they need to call overloaded helpers.

### Step 6: Add tests and documentation
- Add unit coverage for function id generation and type encoding.
- Add parser/compiler tests for duplicate names with distinct signatures.
- Add semantic tests for duplicate signatures, mismatched arity in overload sets, and zero-parameter overload rejection.
- Add call resolution tests for scalar and pointer overloads.
- Add export validation tests that overloaded functions cannot be exported.
- Document the overload rules in compiler function docs.

## Validation Checkpoints

- `npx nx run compiler:test -- --run src/utils/functionValueType.test.ts src/semantic/normalizeCompileTimeArguments.test.ts src/stackAnalysis/analyzeInstruction.test.ts`
- `npx nx run compiler:test -- --run tests/instructions/function.test.ts tests/instructions/call.test.ts tests/exportedFunctions.test.ts`
- `npx nx run compiler:typecheck`
- `npx nx run compiler-spec:typecheck`

## Success Criteria

- [ ] Two functions with the same name and same positive arity but different parameter types compile and can be called by source name.
- [ ] Generated compiled function ids include the encoded parameter signature for every function, including non-overloaded functions.
- [ ] Zero-parameter functions use `__void` and cannot be overloaded.
- [ ] Overload sets with mismatched arity are rejected.
- [ ] Duplicate overload signatures are rejected even when return types differ.
- [ ] Calls resolve only by exact stack operand type match.
- [ ] Pointer overloads fail clearly when the stack operand lacks enough pointer type metadata.
- [ ] Overloaded functions cannot be exported directly.

## Affected Components

- `packages/compiler-spec/src/ast.ts` - function AST identity/name metadata.
- `packages/compiler-spec/src/compiled.ts` - function metadata and compiled function contracts.
- `packages/compiler-spec/src/functionTypes.ts` - signature utilities and type identity helpers.
- `packages/compiler/src/semantic/buildNamespace.ts` - overload collection and duplicate validation.
- `packages/compiler/src/semantic/normalization/call.ts` - source-name call target lookup.
- `packages/compiler/src/stackAnalysis/analyzeInstruction.ts` - stack-based overload resolution.
- `packages/compiler/src/instructionCompilers/call.ts` - concrete target emission should remain simple.
- `packages/compiler/src/index.ts` - compiled function ordering, Wasm index assignment, and export validation.
- `packages/compiler/docs/instructions/blocks/function.md` - user-facing overload rules.

## Risks & Considerations

- **Breaking change**: compiled function ids will change for all functions because every id includes a parameter signature.
- **Diagnostics**: user-facing errors should report the source function name and signature, while compiler metadata can show the generated id.
- **Pointer metadata**: pointer overload resolution depends on stack address metadata being preserved through `push`, locals, and pointer arithmetic.
- **Generic functions**: this should be implemented before generic expansion so generic templates can later generate concrete overloads.
- **AST cache**: signature-derived ids may need cache-key review if function AST identity becomes more than the source block index.

## Related Items

- **Related**: `docs/todos/archived/395-add-exported-8f4e-functions.md`
- **Related**: `docs/todos/archived/397-finish-compiler-stack-analysis-codegen-separation.md`
- **Related**: `docs/todos/archived/413-split-compiled-function-lifecycle-types.md`
- **Related**: `docs/todos/425-split-stack-item-value-and-address.md`
- **Related**: `docs/todos/431-separate-pointer-type-and-provenance-facts.md`

## Notes

- This TODO intentionally records polymorphism before generics. The planned generic implementation can expand templates into concrete overloads and then rely on this overload-resolution path.
- Design decisions from discussion:
  - exact-match overload resolution only
  - generated ids are visible in compile output
  - user code calls by source name
  - overloaded functions cannot be exported directly
  - overload sets must share the same arity and have at least one parameter
  - functions are global
