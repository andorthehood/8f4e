# @8f4e/memory-default-resolver

`@8f4e/memory-default-resolver` resolves memory declaration defaults after memory layout and memory references are resolved.

The package reads the completed `@8f4e/memory-planner` layout plus the `@8f4e/memory-reference-resolver` report. The plan is the source of truth for module order, declaration order, declaration type facts, and the effective declaration source lines produced by `shape` expansion. The memory-reference report supplies resolved default/initializer arguments and pointer target metadata for those declaration sources.

```ts
const result = resolveMemoryDefaults({
	memoryPlan,
	memoryReferences,
});
```

The result contains:

- `memoryDefaultsByModuleId`: scalar defaults, array initializer defaults, explicit-default flags, and inherited-shape flags.
- `pointerMetadataByModuleId`: pointer target memory metadata supplied by the memory-reference report.

This package does not decide addresses, expand `shape` declarations, expand function parameter shapes, validate duplicate declarations, resolve memory references, or compile instructions.
