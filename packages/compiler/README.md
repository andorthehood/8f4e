# @8f4e/compiler

Core compiler that transforms an 8f4e project into WebAssembly plus runtime metadata.

## Quickstart

After completing the [repository setup](../../CONTRIBUTING.md#getting-started), build the compiler and its dependencies
from the repository root. `@8f4e/compiler` is a workspace package in this checkout.

```sh
npx nx run @8f4e/compiler:build
```

Save the following as `quickstart.mjs` in the repository root:

```js
import { compileProject, parseProjectSource } from '@8f4e/compiler';

const project = parseProjectSource(`8f4e/v1
entry main
module counter
int value 41
push &value
push value
push 1
add
store
moduleEnd
entryEnd

function double
#export
param int value
push value
push 2
mul
functionEnd int
`);

const firstResult = await compileProject(project, { disableSharedMemory: true });
const pages = Math.max(1, Math.ceil(firstResult.requiredMemoryBytes / 65536));
const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });
const { instance } = await WebAssembly.instantiate(new Uint8Array(firstResult.codeBuffer), {
	host: { memory },
});

instance.exports.initDefaults();
instance.exports.main();

const valueAddress = firstResult.memoryPlan.modules.counter.memory.value.byteAddress;
console.log(new DataView(memory.buffer).getInt32(valueAddress, true)); // 42
console.log(instance.exports.double(21)); // 42

const secondResult = await compileProject(project, {
	disableSharedMemory: true,
	cache: firstResult.cache,
});
```

Run it with `node quickstart.mjs`; it prints `42` twice. `requiredMemoryBytes` determines the number of 64 KiB
WebAssembly pages to allocate. Call `initDefaults()` before invoking entries so declared defaults, such as `41`, are
present. The `byteAddress` field is measured in bytes, and the `true` argument to `getInt32` selects little-endian reads.

The example uses non-shared memory, so both compilations set `disableSharedMemory: true`. The compiler enables shared
memory by default; hosts using that mode must supply matching memory created with `shared: true` and a maximum.

The second compilation reuses the returned cache. It produces a new compilation result; to execute it, instantiate
`secondResult.codeBuffer` with suitable memory and initialize that instance's defaults too.

Next, see [standard-library includes](docs/standard-library.md#include-syntax) and supply `resolveInclude` to load their
source text. For executable assertions, see the [testing instructions](docs/instructions/testing.md) and
[@8f4e/test-runner](../test-runner/README.md). The [compiler design](docs/compiler-design.md) describes the pipeline in
more detail.

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
`expose <name> &<module>:<memory>`. Exposures are symbolic aliases: references such as `&audio:level` resolve through
the alias table to the backing declaration, so aliases allocate no memory and source references remain unchanged.
Group names and exposure target-module names follow the source module-name rules so canonical paths remain referenceable.
Each exposure inherits its backing declaration's type. `CompileResult.projectMemoryExposuresByGroupPath`
retains each resolved exposure together with its backing `PlannedMemoryDeclaration` for editors and other hosts.

Inside a group, `init &<exposed-memory> <number>` overrides a scalar declaration's default without changing its source.
An address value, as in `init &input &source:output`, resolves against the immediate parent project. Initializers share
ordinary default conversion and `initDefaults()` timing, including for inherited scalar declarations.

## Compiler Passes

```text
composed, validated ASTs
  -> check module identities
  -> resolve constants
  -> plan module/declaration addresses in one memory
  -> resolve memory references, pointer element counts, and defaults
  -> register functions and resolve semantic references
  -> analyze stacks and plan assertions/functions
  -> emit module/function bytecode and passive initialization segments
  -> assemble WebAssembly and runtime metadata
```

Module execution retains the composer-provided order; memory layout allocates modules alphabetically by id.
Semantic resolution and stack analysis consume the authoritative memory plan and pointer counts directly. Codegen
consumes resolved bodies and stack reports without replaying source declarations.

## Runtime memory

Compiled programs import one WebAssembly linear memory as `host.memory`. All module declarations share this address
space. The memory planner lays modules out alphabetically by id, while module execution follows the composer-provided
order. `CompileResult.requiredMemoryBytes` reports the allocation size, and `initDefaults()` initializes that memory.

Layout addresses and counts use fixed 4-byte allocation units. Typed element widths remain independent of that grid:
one `float64` occupies two units, while four `int8[]` elements fit in one unit. See
[allocation units and API migration](docs/allocation-units.md) for the layout fields and renamed public APIs.
