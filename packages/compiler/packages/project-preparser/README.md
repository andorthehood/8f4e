# @8f4e/project-preparser

`@8f4e/project-preparser` parses `.8f4e` project documents and prepares compiler input blocks.

The package-level flow is:

```ts
const project = parseProjectSource(sourceText);
const input = await prepareCompilerInputAsync(project, {
	resolveInclude,
});
```

It understands project-level structure such as entries, groups, includes blocks, and document block delimiters. `prepareCompilerInputAsync` reduces that project document into the `CompileInput` shape consumed by the compiler: entries/modules, constants, functions, and prototypes.

This package owns:

- Parsing raw project source into `ProjectDocument` blocks and groups.
- Classifying project document blocks.
- Preserving entry membership for module blocks.
- Resolving includes through a caller-provided `resolveInclude` callback.
- Converting enabled project blocks into compiler input arrays.

This package does not own:

- Loading include files from disk, the network, editor state, or any other environment.
- Tokenizing compiler source blocks into ASTs.
- Constant inlining, memory planning, stack analysis, or code generation.
- Editor layout, rendering, storage, or VS Code/webview state.

Groups are project organization metadata. They are parsed as project structure, but compiler input preparation only emits basic compiler blocks.
