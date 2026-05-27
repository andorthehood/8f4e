# @8f4e/compiler

Core compiler that transforms 8f4e source into WebAssembly plus runtime metadata. It exposes the main compiler API along with a `syntax` export used by editor tooling.

## Compiler Passes

```text
                         8f4e Compiler Pipeline
                         ======================

  source modules          source functions          optional macros
       |                        |                         |
       |                        |                         |
       +------------------------+-------------------------+
                                |
                                v
                  +-----------------------------+
                  |  1. Macro collection        |
                  |  parseMacroDefinitions()    |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  2. Macro expansion         |
                  |  expandMacros()             |
                  |  preserves line metadata    |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  3. Tokenize / parse        |
                  |  compileToASTGroup()        |
                  |                             |
                  |  syntax errors live here    |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  4. Module identity checks  |
                  |  assertUniqueModuleIds()    |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  5. Input-order contract    |
                  |  caller-provided order      |
                  |                             |
                  |  module execution and       |
                  |  memory layout preserve     |
                  |  the incoming order         |
                  +-----------------------------+
                                |
                                v
                  +-----------------------------+
                  |  6. Namespace collection    |
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
|  7a. Function metadata      |          |  7b. Module layout ready    |
|  collectFunctionMetadata... |          |  memory starts are known    |
|                             |          |  intermodule refs resolved  |
|  call targets/signatures    |          +-----------------------------+
+-----------------------------+                         |
        |                                               |
        v                                               v
+-----------------------------+          +-----------------------------+
|  8a. Function codegen       |          |  8b. Module codegen         |
|  compileFunction()          |          |  compileModule()            |
|                             |          |                             |
|  normalize compile-time     |          |  prepass again, normalize   |
|  args, validate stack,      |          |  compile-time args, validate|
|  emit WASM body             |          |  stack, emit WASM cycle fn  |
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
                  | 10. WASM assembly           |
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
  -> macros
  -> AST
  -> caller-provided module order
  -> namespace + memory layout
  -> semantic normalization + validation
  -> instruction codegen
  -> WASM module + runtime metadata
```
