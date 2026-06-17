# @8f4e/constant-resolver

`@8f4e/constant-resolver` resolves `const` declarations and constant namespace imports for a whole compiler project.

The project-level entry point receives the original AST grouping:

```ts
const result = resolveConstants({
	ast: {
		prototypes,
		modules,
		constants,
		functions,
	},
});
```

The returned result keeps the AST unchanged. It contains:

- `namespaces`: resolved constants keyed by namespace id.
- `references`: per-line constant resolution facts aligned with the original AST arrays.

Downstream passes consume the original AST plus these facts. A line fact may provide replacement `arguments` when constant references or constant declaration values were resolved.

This package owns:

- Building constant namespaces from `constants` blocks and module ASTs.
- Resolving `use` dependencies between constant namespaces.
- Resolving constant declarations in source order.
- Extracting constant-resolved argument facts for prototypes, modules, constants blocks, and functions.

This package does not own:

- Source parsing or syntax validation.
- Memory reference resolution such as `count(name)`, `sizeof(name)`, or `&name`.
- Memory layout planning, memory default resolution, stack analysis, or code generation.
- Returning transformed ASTs or mutating AST lines.
- Semantic validation beyond constant namespace resolution.

External constants can be supplied through `ResolveConstantsOptions.namespaces` when a caller already has trusted namespace data.
