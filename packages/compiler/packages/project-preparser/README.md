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
- Preserving project/group-level `pass <namespace>` declarations for the program composer.
- Parsing `expose <type> <name> &<module>:<memory>` declarations owned by groups.
- Parsing and resolving include declarations for the public compiler facade.

This package does not own:

- Loading include files from disk, the network, editor state, or any other environment.
- Tokenizing compiler source blocks into ASTs.
- Constant resolution, memory planning, stack analysis, or code generation.
- Editor layout, rendering, storage, or host webview state.

Groups recursively own their project blocks. Their memory exposure declarations remain symbolic project metadata;
the program composer resolves those aliases before the compiler's single global memory-planning pass.

Include declarations use `include <path> [exportedName [localName]]`: omit the name to expose all public exports,
select an exported name to expose its overload family, or add a local name to rename that selection. Repeated selections
are merged per source, with one local name per export. Conflicting selections of one export under different local names
are rejected. The program composer applies final declaration names and include-local call targets to validated ASTs.
Later compiler passes receive ordinary functions. Include-specific internal names use `nonexported` for functions without
an export marker and `unselected` for exports that were not selected. Collisions with project declarations are handled by
ordinary namespace validation.
