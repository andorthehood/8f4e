# @8f4e/stack-analyzer

`@8f4e/stack-analyzer` owns semantic stack validation and stack-effect analysis for a compiled project.

```ts
const stackReport = analyzeStack({
	ast: { modules, functions },
	semanticReferences,
	namespaces,
	memoryPlan,
	memoryDefaultsByModuleId,
	pointerMetadataByModuleId,
	functions,
	functionTypeRegistry,
	memoryRegions,
	prototypeShapes,
});
```

The root package entrypoint exports `analyzeStack`. It receives the unchanged project ASTs, a semantic reference report, and the compiler metadata that already exists after namespace, memory layout, memory default, memory reference, function metadata, and semantic reference resolver passes. It returns a project stack-analysis report keyed by module id and function id.

Each module/function report contains:

- analyzed codegen lines in source order
- stack-analysis snapshots for compiled output metadata
- final stack state
- function metadata needed to compile the function body
- stack-derived module/function facts such as `skipExecutionInCycle`, imports, exports, locals, and parameter counts

The stack analyzer is responsible for:

- operand count and operand type checks declared by instruction specs
- instruction-specific stack effects not expressible in the central instruction spec
- stack-relevant source effects for modules, functions, locals, params, blocks, maps, and directives
- function call overload matching from the current namespace registry
- function return stack validation
- block result stack validation
- map input/output stack compatibility
- address, pointer, clamp-range, and known-integer stack metadata propagation
- `push`, pointer dereference, and `pushShape` stack item production from resolved semantic facts

It is not responsible for parsing, syntax validation, namespace construction, memory layout planning, memory default resolution, memory-reference resolution, semantic reference resolution, or WASM/codegen emission. Those earlier passes provide the AST and semantic metadata; later codegen consumes the stack report and does not perform stack analysis.
