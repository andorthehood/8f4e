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
  program-composer (recursive traversal, parsing, symbol isolation, child-first module order)
                                             |
                                             v
  private global compiler stages
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

Nested `groups` are composed before semantic allocation and code generation. The composer qualifies nested module,
function, constant-namespace, and prototype names so sibling groups may reuse source-level names safely. It then hands
one flattened validated-AST program to the compiler, allowing memory addresses, function indexes, type indexes, and
entries to be planned once. Child modules execute before parent modules for the same entry.

Groups can make a parent constants-block namespace available locally with `pass <namespace>`. The pass is explicit at
every parent-to-child boundary and preserves the local namespace name; each consuming block still imports it with the
ordinary `use <namespace>` instruction. The compiler resolves passes as qualified namespace aliases, so it does not
copy constants or inject declarations into block ASTs.

Groups may publish direct-module memory items to their enclosing project with
`expose <type> <name> &<module>:<memory>`. Exposures are symbolic aliases: the composer rewrites references such as
`&audio:level` to the backing canonical module reference before the global memory pass, so aliases allocate no memory.
Group names and exposure target-module names follow the source module-name rules so canonical paths remain referenceable.
The declared public type is not checked against the target type. `CompileResult.projectMemoryExposuresByGroupPath`
retains each resolved exposure together with its backing `PlannedMemoryDeclaration` for editors and other hosts.

## Compiler Passes

```text
                       8f4e Composed Program Pipeline
                       ==============================

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
                  |  composer-provided order    |
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
                  |  for the composed program   |
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
                  |  project memory exposures   |
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
  -> private emission artifacts
  -> WASM module + runtime metadata
```
