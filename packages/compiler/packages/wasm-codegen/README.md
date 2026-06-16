# @8f4e/wasm-codegen

WebAssembly code generation for 8f4e.

This package owns bytecode emission, instruction compilers, WASM function bodies, initial memory data segments, memory-import sizing, and final WASM section assembly. It consumes semantic compiler artifacts such as validated ASTs, namespaces, memory plans, stack reports, and resolved defaults; it does not parse source or decide project-level compiler pass ordering.

Target-independent semantic helpers belong in `@8f4e/semantic-utils`. Language constants and instruction metadata belong in `@8f4e/language-spec`.
