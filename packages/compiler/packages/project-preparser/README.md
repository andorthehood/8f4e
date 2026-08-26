# @8f4e/project-preparser

`@8f4e/project-preparser` parses `.8f4e` project documents into the canonical compiler-owned object model.

The package-level flow is:

```ts
const project: ProjectObjectModel = parseProjectSource(sourceText);
```

It understands document delimiters, entries, recursively owned groups, group memory exposures, disabled blocks, and
block markers. Parsing classifies every block once into the corresponding `ProjectObjectModel` collection. The model
itself is defined only by `@8f4e/language-spec`.

This package owns:

- Parsing raw project source into `ProjectObjectModel` collections and groups.
- Classifying project document blocks.
- Preserving entry membership for module blocks.
- Parsing `expose <type> <name> &<module>:<memory>` declarations owned by groups.
- Parsing and resolving include declarations for the public compiler facade.

This package does not own:

- Loading include files from disk, the network, editor state, or any other environment.
- Tokenizing compiler source blocks into ASTs.
- Constant resolution, memory planning, stack analysis, or code generation.
- Editor layout, rendering, storage, or VS Code/webview state.

Groups recursively own their project blocks. Their memory exposure declarations remain symbolic project metadata;
the program composer resolves those aliases before the compiler's single global memory-planning pass.
