# @8f4e/compiler

Core compiler that transforms one closed 8f4e sub-program into WebAssembly plus runtime metadata.

## Compilation boundaries

```text
project document
  -> project-preparser
  -> SubProgramSource
  -> sub-program compiler
  -> CompiledSubProgram
  -> WebAssembly emission
  -> CompileResult
```

A `SubProgramSource` is an atomic compilation unit containing entries, modules, functions, constants, and prototypes.
All names and memory references resolve within that boundary. `ProgramSource` provides a source-level container that can
assign identities to multiple sub-programs, but cross-unit linking and relocation are intentionally not implemented yet.

`CompiledSubProgram` is the emission handoff, not yet a generally relocatable object format: its function indexes and
memory addresses have already been assigned within one unit.

## Compiler Passes

```text
                       8f4e Sub-program Pipeline
                       =========================

  source modules       source functions       constants/prototypes
       |                     |                       |
       |                     |                       |
       +---------------------+-----------------------+
                             |
                             v
                  +-----------------------------+
                  |  1. Tokenize / parse        |
                  |  compileToAST()             |
                  |                             |
                  |  syntax errors live here    |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  2. Module identity checks  |
                  |  assertUniqueModuleIds()    |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  3. Input-order contract    |
                  |  caller-provided order      |
                  |                             |
                  |  module execution and       |
                  |  memory layout preserve     |
                  |  the incoming order         |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  4. Namespace collection    |
                  |  collectNamespacesFromASTs()|
                  |  discovery + layout         |
                  |                             |
                  |  resolves module memory,    |
                  |  consts, addresses, sizes   |
                  +-----------------------------+
                                |
                                v
        +-----------------------+-----------------------+
        |                                               |
        v                                               v
+-----------------------------+          +-----------------------------+
|  5a. Function metadata      |          |  5b. Module layout ready    |
|  collectFunctionMetadata... |          |  memory starts are known    |
|                             |          |  intermodule refs resolved  |
|  call targets/signatures    |          +-----------------------------+
+-----------------------------+                         |
        |                                               |
        +-----------------------+-----------------------+
                                |
                                v
                  +-----------------------------+
                  |  6. Semantic references     |
                  |  resolveSemanticReferences()|
                  |                             |
                  |  resolve value refs once    |
                  |  for the whole sub-program  |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  7. Stack analysis          |
                  |  analyzeStack()             |
                  |                             |
                  |  validate stack effects     |
                  |  from reference report      |
                  +-----------------------------+
                                |
                                v
        +-----------------------+-----------------------+
        |                                               |
        v                                               v
+-----------------------------+          +-----------------------------+
|  8a. Function codegen       |          |  8b. Module codegen         |
|  compileFunction()          |          |  compileModule()            |
|                             |          |                             |
|  emit WASM body from        |          |  emit WASM cycle fn from    |
|  AST + semantic/stack facts |          |  AST + semantic/stack facts |
+-----------------------------+          +-----------------------------+
        |                                               |
        +-----------------------+-----------------------+
                                |
                                v
                  +-----------------------------+
                  |  9. Initial memory data     |
                  |  createInitialMemory...     |
                  |                             |
                  |  defaults become passive    |
                  |  WASM data segments         |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  10. WASM assembly          |
                  |                             |
                  |  type/import/function/      |
                  |  export/code/data sections  |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  CompileResult              |
                  |                             |
                  |  codeBuffer                 |
                  |  compiledModules            |
                  |  compiledFunctions          |
                  |  requiredMemoryBytes        |
                  |  cache                      |
                  +-----------------------------+
```

Short version:

```text
source
  -> AST
  -> caller-provided module order
  -> namespace + memory layout
  -> semantic reference resolution
  -> stack validation
  -> instruction codegen from AST + pass reports
  -> CompiledSubProgram
  -> WASM module + runtime metadata
```
