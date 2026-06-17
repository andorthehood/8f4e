# @8f4e/semantic-reference-resolver

`@8f4e/semantic-reference-resolver` is the project-level compiler pass that resolves semantic value references after constants, memory layout references, defaults, namespaces, and function metadata are available.

It owns:

- folding remaining literal compile-time value expressions;
- resolving instruction value positions that refer to memory declarations, locals, pointers, and functions;
- extracting push, call, localSet, and pushShape semantic facts without mutating the source AST;
- producing a semantic reference report whose per-line facts are aligned with the original module/function AST lines.

It does not own:

- source tokenization or syntax validation;
- constant inlining;
- memory layout planning;
- memory address/reference inlining;
- stack-effect validation;
- WebAssembly bytecode emission.

The compiler should call this pass once per project compilation from `compileSubProgram`. Downstream passes should consume the semantic reference report alongside the unchanged project AST instead of running their own line-by-line reference resolution. The report is a delta: it stores only extracted facts such as resolved arguments, local metadata, push targets, inline call pushes, and shape expansions.
