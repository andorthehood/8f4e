# @8f4e/memory-planner

`@8f4e/memory-planner` decides module addresses and memory declaration addresses for a project.

The planner receives planner-ready memory layout source:

- `prototypes`: prototype ids with normalized memory declaration lines.
- `modules`: module ids, optional memory region lines, and ordered layout source lines.

Module layout source lines are either memory declarations or `shape` lines. The planner expands `shape` lines into effective declaration sources, then plans those declarations in order.

```ts
const memoryPlan = planMemoryLayout({
	prototypes,
	modules,
	startingByteAddress,
	memoryRegions,
});
```

The returned plan contains:

- `moduleList`: planned modules in layout order.
- `modules`: planned modules keyed by id.
- `nextByteAddressByMemoryIndex`: memory-size cursors after all modules are placed.
- `declarationSources`: effective declaration source lines for each planned module, including inherited `shape` declarations.

## Ownership

This package owns:

- Module byte addresses.
- Memory declaration byte addresses.
- Declaration order after `shape` expansion.
- Declaration size and type layout facts.
- Unknown `shape` prototype references, because layout cannot be planned without them.

This package does not own:

- Constant inlining.
- Memory-reference inlining.
- Default value resolution.
- Pointer target metadata overlays.
- Function parameter shape expansion.
- Code generation or stack/type validation.

The planner expects array element counts to already be literal planner-ready values. Layout-dependent declaration sizes, such as `int[] dest count(source)`, are not supported.
