# @8f4e/stack-analyzer

This package validates executable stacks and propagates execution facts for resolved module and function bodies.

```ts
const stackReport = analyzeStack({
	semanticReferences,
	namespaces,
	memoryPlan,
	memoryDefaultsByModuleId,
	pointerMetadataByModuleId,
	functions,
	functionTypeRegistry,
});
```

Resolved bodies already contain source binding identities and declaration metadata. The analyzer tracks local value and pointer facts by binding identity, independently of WebAssembly storage. It validates function returns against registered signatures and matches call overloads using stack operand types.

Each report contains stack snapshots, per-line execution facts, the final stack, and function usage. Per-line facts retain original source-line indexes; declaration positions have no execution facts. Imports, exports, expanded parameters, locals, and module execution directives belong to the resolved units, not the stack report.

The analyzer owns operand checks, stack effects, block results, map compatibility, and address, pointer, clamp-range, and known-value propagation. It allocates no WebAssembly locals, including loop counters. Codegen consumes its execution facts without repeating stack analysis.
