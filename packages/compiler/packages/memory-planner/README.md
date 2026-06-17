# @8f4e/memory-planner

`@8f4e/memory-planner` decides module addresses and memory declaration addresses for a project.

The project-level entry point receives validated module and prototype ASTs plus constant-resolution facts:

```ts
const memoryPlan = planProjectMemoryLayout({
	prototypes,
	modules,
	constantReferences,
	startingByteAddress,
	memoryRegions,
});
```

The planner builds planner-ready memory layout source from those ASTs:

- `prototypes`: prototype ids with normalized memory declaration lines.
- `modules`: module ids, optional memory region lines, and ordered layout source lines.

Module layout source lines are either memory declarations or `shape` lines. The planner expands `shape` lines into effective declaration sources, then plans those declarations in order.

The returned plan contains:

- `moduleList`: planned modules in layout order.
- `modules`: planned modules keyed by id.
- `nextByteAddressByMemoryIndex`: memory-size cursors after all modules are placed.
- `declarationSources`: effective declaration source lines for each planned module, including inherited `shape` declarations.

## Ownership

This package owns:

- Module byte addresses.
- Memory declaration byte addresses.
- Building planner-ready memory layout source from validated ASTs.
- Declaration order after `shape` expansion.
- Declaration size and type layout facts.
- Unknown `shape` prototype references, because layout cannot be planned without them.

This package does not own:

- Constant resolution.
- Memory-reference inlining.
- Default value resolution.
- Pointer target metadata overlays.
- Function parameter shape expansion.
- Code generation or stack/type validation.

The planner reads constant-resolution facts before normalizing declaration sizes. It expects array element counts to become literal planner-ready values after those facts and pure literal arithmetic are applied. Layout-dependent declaration sizes, such as `int[] dest count(source)`, are not supported.
