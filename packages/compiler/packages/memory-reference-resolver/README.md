# @8f4e/memory-reference-resolver

`@8f4e/memory-reference-resolver` is the compiler pass that resolves memory-layout references into report facts aligned with validated AST lines.

The pass is separate from memory planning. The memory planner decides where modules and declarations live. The memory reference resolver uses that completed layout as source data when later compiler stages need concrete values.

## Pipeline Position

The intended order is:

1. Parse and validate source into ASTs.
2. Resolve constants with `@8f4e/constant-resolver`.
3. Normalize layout declaration counts into planner-ready source lines.
4. Plan memory layout with `@8f4e/memory-planner`, including `shape` expansion.
5. Resolve memory references once with `@8f4e/memory-reference-resolver`.
6. Resolve memory defaults and pointer target metadata with `@8f4e/memory-default-resolver`.
7. Run semantic analysis and code generation on the original AST plus pass reports.

This pass should not be used to make memory declarations plan-able. Declaration sizes handed to the memory planner must already be literal layout input. Layout-dependent declaration sizes, such as `int[] dest count(source)`, are not part of this pass.

## Inputs

The pass receives:

- The whole project AST, grouped by block kind.
- Constant-resolution facts aligned with that AST.
- The completed `@8f4e/memory-planner` layout plan for that same project AST.

The memory layout plan remains the source of truth while references are resolved. This package should read planned modules and declarations directly from that plan rather than converting them into compiler namespace state.

The resolver returns pointer metadata discovered from planned memory declaration sources so later passes can use the same pointer facts without re-running memory-reference resolution.

## Output

The pass returns `references`, a report containing:

- `prototypes`, `modules`, `constants`, and `functions`: per-line argument facts aligned with the input AST arrays.
- `declarationSourcesByModuleId`: per-line argument facts aligned with each planned module's effective declaration sources.
- `pointerMetadataByModuleId`: pointer target facts derived from resolved declaration-source address defaults.

When a resolved value is an address, the literal should keep the address metadata needed by later compiler stages, such as memory index, memory region name, safe range, and clamp range.

The pass must not mutate the caller's AST or namespace tables.

Within memory declaration lines, this pass may resolve scalar default values and array initializer values into report facts. It must not be used to make array element-count arguments plan-able; those counts are layout input and must already be literal before the memory planner runs.

There should be one project-level call during compilation:

```ts
const memoryPlan = planProjectMemoryLayout({
	prototypes,
	modules,
});
const memoryReferences = resolveMemoryReferences({
	ast: {
		prototypes,
		modules,
		constants,
		functions,
	},
	memoryPlan,
	constantReferences,
});
```

The resolver may traverse modules internally to resolve module-local forms such as `&this` or `count(buffer)`, but callers should not invoke the pass once per module. Module scoping is part of the pass.

## References Owned By This Pass

The memory reference resolver owns value resolution for memory-layout expressions, including:

- `count(name)`
- `sizeof(name)`
- `min(name)`
- `max(name)`
- `&name`
- `name&`
- `&this`
- `this&`
- `&module:`
- `module:&`
- `&module:name`
- `module:name&`
- `&module:index`
- `&this:index`
- Arithmetic around resolved memory-layout values, such as `sizeof(buffer)*2`, `&buffer+4`, or `4+&buffer`.
- Intermodule metadata expressions, such as `count(module:name)` or `sizeof(module:name)`.

Pointer metadata expressions belong here when the required pointer facts are available from memory layout:

- `count(*pointer)`
- `sizeof(*pointer)`
- `min(*pointer)`
- `max(*pointer)`

Pointer metadata that depends on locals created while compiling an instruction stream is not part of the project-level memory-plan pass. That state is not known from the AST plus memory plan alone and should not force this package to accept compiler execution context.

## Out Of Scope

This package must not:

- Resolve constants. That belongs to `@8f4e/constant-resolver`.
- Decide module or declaration addresses. That belongs to `@8f4e/memory-planner`.
- Expand `shape` declarations. That belongs to `@8f4e/memory-planner`.
- Apply scalar defaults or array initializer defaults.
- Resolve calls, function overloads, locals, stack effects, or code generation details.
- Validate duplicate module ids, duplicate declarations, instruction arity, or syntax.
- Add compatibility shims for old compiler-internal argument-resolution APIs.

## Error Ownership

The pass leaves unresolved references unchanged. Callers that require full resolution must validate the composed line and report compiler-compatible semantic errors.

It should not revalidate facts guaranteed by earlier stages, such as token shape, argument count, or whether a declaration id is unique. Those checks belong to the parser, semantic compiler, or memory planner input builder as appropriate.

## API Shape

The package entry point is an `index.ts` function that returns an explicit result object rather than using callbacks:

```ts
const result = resolveMemoryReferences({
	ast: {
		prototypes,
		modules,
		constants,
		functions,
	},
	memoryPlan,
	constantReferences,
});
```

The compiler pipeline should use the project-level entry point and pass the returned report to later compiler stages.
