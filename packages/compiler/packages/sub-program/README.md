# @8f4e/sub-program

Internal compiler orchestration package. It is available only through the `@8f4e/sub-program/internal` subpath used by
`@8f4e/compiler`; project-facing consumers use `parseProjectSource` and `compileProject` from the compiler facade.

The package consumes the validated-AST program produced by `@8f4e/program-composer` and runs the global compilation
passes that produce emission-ready module, function, and memory artifacts. No separate source-level project contract is
exposed; `ProjectObjectModel` remains owned by `@8f4e/language-spec`.

All recursively owned projects have already been flattened with isolated internal symbols at this boundary. Memory
addresses and function/type indexes are therefore assigned once for the complete program, avoiding a linker or
relocation layer before final WebAssembly emission.
