# @8f4e/memory-default-resolver

`@8f4e/memory-default-resolver` resolves memory declaration defaults after memory layout is planned.

The package reads the completed `@8f4e/memory-planner` layout. The plan is the source of truth for module order, declaration order, declaration type facts, and the effective declaration source lines produced by `shape` expansion.

```ts
const result = resolveMemoryDefaults({
	memoryPlan,
});
```

The result contains:

- `memoryDefaultsByModuleId`: scalar defaults, array initializer defaults, explicit-default flags, and inherited-shape flags.
- `pointerMetadataByModuleId`: pointer target memory metadata derived from address defaults.

This package may resolve memory-reference expressions that appear in defaults by reading the completed plan. It does not decide addresses, expand `shape` declarations, expand function parameter shapes, validate duplicate declarations, or compile instructions.
