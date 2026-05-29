# Compiler Directives

Compiler directives are special instructions prefixed with `#` that control compilation behavior without affecting runtime execution. They are processed during compilation and filtered out before code generation.

Compiler directives are block prologue metadata. In a `module`, module-scoped directives must appear immediately after the `module` line and before declarations or executable instructions. In a `function`, function-scoped directives must appear immediately after the `function` line and before `param`, `local`, or executable instructions. Blank lines and comments are ignored by parsing, so they can still appear around prologue directives.

## Module-Scoped Directives

### `#region`

Assigns all declarations in the current module to a logical memory region.

**Scope:** Module blocks only

**Syntax:** `#region <region-name-or-index>`

**Usage:**
```8f4e
module samples
#region sampleMemory
int8[] values 1024
moduleEnd
```

**Behavior:**
- Region names come from the compiler option `memoryRegions`, where index `0` is always the implicit default memory and custom names start at Wasm memory index `1`
- `#region sampleMemory` resolves by name; `#region 1` resolves by Wasm memory index; `#region 0` selects the implicit default memory
- The directive applies to declarations in the module only and must appear before any declaration or executable instruction
- Address references such as `&samples:values` carry their source region, so `load`, `store`, `storeBytes`, `memoryCopy`, pointer defaults, and `push *ptr` use the memory region carried by the address or pointer provenance
- Raw integer addresses without address provenance use memory index `0`
- Compiler-generated internal resources remain in memory index `0` so small hot runtime state stays in the default memory
- `requiredMemoryBytes` reports only the implicit default memory; custom regions are reported separately as `requiredMemoryBytesByRegion`

**Errors:**
- Using `#region` outside of a module block will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error
- Placing `#region` after a declaration or executable instruction will result in a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error
- Unknown region names, out-of-bounds numeric indices, duplicate configured names, numeric-looking configured names, and reserved configured names such as `default` or `memory` produce compiler diagnostics

**Example:**
```8f4e
module samples
#region sampleMemory
int8[] values 4 11
moduleEnd

module reader
int result
int8* ptr &samples:values
push &result
push *ptr
store
moduleEnd
```

With `memoryRegions: ['sampleMemory']`, `values` is stored in Wasm memory index `1`. The pointer slot `ptr` lives in the default memory because `reader` has no `#region`, but its pointee metadata still targets `sampleMemory`, so `push *ptr` loads from the sample memory region.

### `#skipExecution`

Marks a module to skip execution in the cycle dispatcher while preserving normal compilation and memory initialization behavior.

**Scope:** Module blocks only

**Usage:**
```8f4e
module myModule
#skipExecution
int counter 0
; ... module code ...
moduleEnd
```

**Behavior:**
- The module is compiled normally (AST, memory map, inter-module references preserved)
- Module memory defaults and initialization still run during the init/memory-init phase
- The module's cycle function is not called from the global cycle dispatcher
- Multiple prologue `#skipExecution` directives in the same module are idempotent (same effect)

**Use Cases:**
- Temporarily disable a module during development without removing it
- Create dormant modules that provide memory/data but don't execute
- Selectively enable/disable module execution for testing or debugging

**Errors:**
- Using `#skipExecution` outside of a module block (e.g., in `constants` or `function` blocks) will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error
- Placing `#skipExecution` after a declaration or executable instruction will result in a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error

**Example:**

```8f4e
; Active module that executes every cycle
module activeModule
int value 0
push value
push value
load
push 1
add
store
moduleEnd

; Disabled module - memory is initialized but cycle code doesn't run
module disabledModule
#skipExecution
int data 42
moduleEnd

; Another module can still reference the disabled module's memory
module consumer
use disabledModule
push disabledModule:data
load
; ... use the value ...
moduleEnd
```

In this example:
- `activeModule` executes every cycle, incrementing its value
- `disabledModule` does not execute, but its memory is initialized with `data = 42`
- `consumer` can access `disabledModule:data` even though `disabledModule` doesn't execute

### `#initOnly`

Marks a module to execute once during the init phase and skip execution in the cycle dispatcher.

**Scope:** Module blocks only

**Usage:**
```8f4e
module myInitModule
#initOnly
int state 0
; ... initialization code ...
moduleEnd
```

**Behavior:**
- The module code runs exactly once during initialization
- The module code does not run during the cycle loop
- Memory declared in the module is initialized with default values before the module code runs
- Incremental recompiles that patch default memory values rerun all init-only modules via the `initOnly` export; full `init` still runs on first compile or memory recreation
- Multiple prologue `#initOnly` directives in the same module have the same effect as one
- If both `#skipExecution` and `#initOnly` are present, `#skipExecution` takes precedence (the module does not execute at all)

**Use Cases:**
- One-time setup or initialization logic that should run before the main cycle loop
- Compute derived values or perform setup operations that depend on other modules' initialized memory
- Initialize state that will be read by other modules during cycle execution

**Errors:**
- Using `#initOnly` outside of a module block (e.g., in `constants` or `function` blocks) will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error
- Placing `#initOnly` after a declaration or executable instruction will result in a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error

**Example:**

```8f4e
; Data module with initialized values
module config
int baseValue 100
moduleEnd

; Init-only module that runs setup logic once
module setup
#initOnly
use config
int derivedValue 0
push derivedValue
push config:baseValue
load
push 2
mul
store
moduleEnd

; Regular module that uses the setup data
module main
use setup
int counter 0
push counter
push counter
load
push 1
add
store
moduleEnd
```

In this example:
- `config` has its memory initialized with `baseValue = 100`
- `setup` runs once during init, computing `derivedValue = baseValue * 2 = 200`
- `main` executes every cycle, incrementing its counter

**Interaction with `#skipExecution`:**

When both directives are present in the same module:
```8f4e
module myModule
#skipExecution
#initOnly
int value 0
; ... code ...
moduleEnd
```

The `#skipExecution` directive takes precedence, and the module code does not execute during either init or cycle. This allows you to temporarily disable a module that was previously marked as init-only without removing the `#initOnly` directive.

### `#test`

Marks a module for execution by the `runTests` export instead of the normal `cycle` dispatcher.

**Scope:** Module blocks only

**Usage:**
```8f4e
module addWorks
#test
push 1
push 2
add
assert 3
moduleEnd
```

**Behavior:**
- The module is compiled like any other module: declarations, memory layout, address references, function calls, and compiler-generated internal resources all use normal module behavior
- The module's cycle function is not called by the global `cycle` dispatcher
- When `includeTestRunner` is enabled, the global `runTests` export calls all modules marked with `#test` in module order
- Failed `assert` instructions call the imported host function `test.assertFailed(assertIndex, expected, received)`
- If no `test.assertFailed` calls occur during `runTests`, the test run passed
- `runTests` does not reset memory between test modules; test isolation comes from each module's own namespace and memory declarations

**Errors:**
- Using `#test` outside of a module block will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error
- Placing `#test` after a declaration or executable instruction will result in a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error

### `#mock`

Marks a block as test-only support for modules that need external dependencies.

**Scope:** Module, constants, and function block prologues

**Usage:**
```8f4e
module filterTest
#test
float* input &source:out
push *input
assert 7
moduleEnd

module source
#mock
float out 7
moduleEnd
```

**Behavior:**
- Normal project builds exclude `#mock` blocks before compiling
- Test builds include `#mock` blocks as ordinary modules, constants, or functions
- The directive itself has no runtime behavior once the block is included
- Mocks can satisfy imports such as `use env`, address defaults such as `&source:out`, or calls to helper functions

**Errors:**
- Placing `#mock` after a declaration or executable instruction will result in a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error

**Example with memory and pointer parameters:**

```8f4e
function readFirst
#impure
param int* ptr
push *ptr
functionEnd int

module readFirstWorks
#test
int[] values 2 7 8
push &values
call readFirst
assert 7
moduleEnd
```

## Module- and Function-Scoped Directives

### `#impure`

Marks the current function as allowed to perform explicit memory IO.

**Scope:** Function blocks only

**Usage:**
```8f4e
function writeSample
#impure
param float* dst
param float value
push dst
push value
store
functionEnd
```

**Behavior:**
- Enables `load`, `load8s`, `load8u`, `load16s`, `load16u`, `loadFloat`, `store`, `storeBytes`, and pointer dereference forms such as `push *ptr` and `push **ptr` inside the current function
- Only permits address-driven memory access
- Does not allow direct module memory identifiers inside functions
- Does not allow memory declarations inside functions

**Errors:**
- Using `#impure` outside a function block results in an `IMPURE_DIRECTIVE_INVALID_CONTEXT` error
- Using memory IO in a function without `#impure` results in an `IMPURE_DIRECTIVE_REQUIRED_FOR_MEMORY_IO` error
- Placing `#impure` after params, locals, or executable instructions results in a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error

### `#loopCap`

Sets the default loop cap for `loop` blocks in the current module or function block. The loop cap limits the maximum number of iterations to prevent infinite loops at runtime.

**Scope:** Module and function blocks

**Syntax:** `#loopCap <non-negative integer>`

**Usage:**
```8f4e
module myModule
#loopCap 5000
; ... loops after this line use a cap of 5000 ...
moduleEnd
```

**Behavior:**
- Sets the ambient loop cap for `loop` instructions in the same module or function body
- A per-loop explicit argument (`loop <int>`) takes precedence over the ambient `#loopCap`
- When no `#loopCap` is present and no per-loop argument is given, the built-in default of `1000` applies
- The cap value `0` is valid and causes the loop guard to exit immediately on the first guard check
- Multiple prologue `#loopCap` directives in the same block are allowed; the last prologue value becomes the ambient default

**Precedence order (highest to lowest):**
1. Explicit `loop <int>` argument
2. Current ambient `#loopCap <int>` value
3. Built-in fallback `1000`

**Use Cases:**
- Raise the cap for modules with legitimately long-running loops (e.g., audio processing)
- Lower the cap during debugging to surface runaway loops earlier
- Set a function-local cap for pure computational functions with deep iterations

**Examples:**

Module-scoped cap:
```8f4e
module demo
#loopCap 5000

loop
  ; uses 5000
loopEnd

loop 32
  ; uses 32 (explicit argument overrides #loopCap)
loopEnd
moduleEnd
```

Function-scoped cap:
```8f4e
function int:int slowPath
#loopCap 2048
param int input
; loops inside this function default to 2048
push input
functionEnd
```

**Errors:**
- Using `#loopCap` outside of a module or function block (e.g., in `constants` blocks or at the top level before any `module`) will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error
- Placing `#loopCap` after params, declarations, locals, or executable instructions will result in a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error
- Providing a non-integer, float, or negative integer argument is a syntax error detected by the tokenizer

## Error Handling

If an unknown compiler directive is encountered, the compiler will throw an `UNRECOGNISED_INSTRUCTION` error.

If a module-scoped directive like `#skipExecution` or `#initOnly` is used outside of a module block, the compiler will throw a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error.

If `#loopCap` is used outside of a module or function block, the compiler will throw a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error.

If a compiler directive appears after the block prologue has ended, the tokenizer will throw a `COMPILER_DIRECTIVE_MUST_BE_PROLOGUE` syntax error.
