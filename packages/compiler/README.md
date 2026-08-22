# @8f4e/compiler

Core compiler that transforms an 8f4e project into WebAssembly plus runtime metadata.

## Compilation boundaries

```text
.8f4e text -> parseProjectSource --\
                                    ProjectObjectModel
editor state ---------------------/         |
                                             v
                                      compileProject
                                             |
                                             v
  private compiler stages
  -> CompiledSubProgram
  -> WebAssembly emission
  -> CompileResult
```

`parseProjectSource(source)` converts the textual `.8f4e` representation to the compiler-owned `ProjectObjectModel`.
`compileProject(project, options)` compiles that object model directly. Editors that already hold typed blocks can skip
the text representation without invoking a second block-classification or whole-project preparation step.

`ProjectObjectModel` is defined by `@8f4e/language-spec`. Its separate `modules`, `functions`, `constants`, `prototypes`,
`includes`, `notes`, and `unknown` collections define block type through membership. Only modules have semantic ordering;
filtering `modules` by `entry` preserves the execution order for that entry. Hoisted declarations do not share a global
order with modules or with each other.

`CompiledSubProgram` is the emission handoff, not yet a generally relocatable object format: its function indexes and
memory addresses have already been assigned within one unit. It is an internal compiler-stage concept, not a public
project input contract.

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
