# @8f4e/constant-inliner

`@8f4e/constant-inliner` resolves `const` declarations and replaces constant references in validated ASTs.

The project-level entry point receives the whole compiler AST grouping:

```ts
const result = inlineConstantsInASTs({
	ast: {
		prototypes,
		modules,
		constants,
		functions,
	},
});
```

The returned result keeps the same grouping and contains AST lines whose constant references and compile-time constant expressions have been replaced with literal arguments when they can be resolved.

This package owns:

- Building constant namespaces from `constants` and module ASTs.
- Resolving `use` dependencies between constant namespaces.
- Resolving constant declarations in source order.
- Inlining constant identifiers and compile-time constant expressions in prototypes, modules, constants blocks, and functions.

This package does not own:

- Source parsing or syntax validation.
- Memory reference inlining such as `count(name)`, `sizeof(name)`, or `&name`.
- Memory layout planning, memory default resolution, stack analysis, or code generation.
- Semantic validation beyond constant namespace resolution.

External constants can be supplied through `InlineConstantsOptions.namespaces` when a caller already has trusted namespace data.
