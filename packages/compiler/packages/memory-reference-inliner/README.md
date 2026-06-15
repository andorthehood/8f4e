# @8f4e/memory-reference-inliner

`@8f4e/memory-reference-inliner` is the compiler pass that replaces memory-layout references in validated AST lines with literal values.

The pass is separate from memory planning. The memory planner decides where modules and declarations live. The memory reference inliner uses that completed layout as source data when later compiler stages need concrete values.

## Pipeline Position

The intended order is:

1. Parse and validate source into ASTs.
2. Inline constants.
3. Build effective module memory declarations, including `shape` expansion.
4. Plan memory layout with `@8f4e/memory-planner`.
5. Inline memory references with `@8f4e/memory-reference-inliner`.
6. Run semantic analysis and code generation on the inlined lines.

This pass should not be used to make memory declarations plan-able. Declaration sizes handed to the memory planner must already be literal layout input. Layout-dependent declaration sizes, such as `int[] dest count(source)`, are not part of this pass.

## Inputs

The pass should receive:

- AST lines or an AST block whose constants have already been inlined.
- The collected namespace table containing finalized module memory layouts.
- The current module identity and current module layout facts when inlining local references.
- Local bindings only when inlining expressions that explicitly depend on local pointer metadata.

## Output

The pass should return copied AST lines with memory-layout value references replaced by literal arguments.

When an inlined value is an address, the literal should keep the address metadata needed by later compiler stages, such as memory index, memory region name, safe range, and clamp range.

The pass should not mutate the caller's AST or namespace tables.

Within memory declaration lines, this pass may inline scalar default values and array initializer values. It must not inline array element-count arguments for planning; those counts are layout input and must already be literal before the memory planner runs.

## References Owned By This Pass

The memory reference inliner owns value resolution for memory-layout expressions, including:

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

Pointer metadata expressions also belong here when the required pointer facts are available from memory layout or provided local bindings:

- `count(*pointer)`
- `sizeof(*pointer)`
- `min(*pointer)`
- `max(*pointer)`

If pointer metadata depends on locals that are only known while compiling an instruction stream, the pass may accept those locals as input. It should not discover or create locals itself.

## Out Of Scope

This package must not:

- Inline constants. That belongs to `@8f4e/constant-inliner`.
- Decide module or declaration addresses. That belongs to `@8f4e/memory-planner`.
- Expand `shape` declarations. That belongs to the effective memory declaration source builder before planning.
- Apply scalar defaults or array initializer defaults.
- Resolve calls, function overloads, locals, stack effects, or code generation details.
- Validate duplicate module ids, duplicate declarations, instruction arity, or syntax.
- Add compatibility shims for old compiler-internal normalization APIs.

## Error Ownership

The pass may report unresolved memory references when the requested memory or module does not exist in the provided finalized layout.

It should not revalidate facts guaranteed by earlier stages, such as token shape, argument count, or whether a declaration id is unique. Those checks belong to the parser, semantic compiler, or memory planner input builder as appropriate.

## API Shape

The package entry point should be an `index.ts` function that returns an explicit result object rather than using callbacks:

```ts
const result = inlineMemoryReferences({
	lines,
	namespaces,
	currentModuleId,
	currentModuleLayout,
	locals,
});
```

The result should contain the inlined lines. Unresolved memory references should be reported as compiler-compatible semantic errors.
