# Compiler Directives

Compiler directives are special instructions prefixed with `#` that control compilation behavior without affecting runtime execution. They are processed during compilation and filtered out before code generation.

## Module-Scoped Directives

### `#skipExecution`

Marks a module to skip execution in the cycle dispatcher while preserving normal compilation and memory initialization behavior.

**Scope:** Module blocks only

**Usage:**
```
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
- Multiple `#skipExecution` directives in the same module are idempotent (same effect)

**Use Cases:**
- Temporarily disable a module during development without removing it
- Create dormant modules that provide memory/data but don't execute
- Selectively enable/disable module execution for testing or debugging

**Errors:**
- Using `#skipExecution` outside of a module block (e.g., in `constants` or `function` blocks) will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error

**Example:**

```
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
```
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
- Multiple `#initOnly` directives in the same module have the same effect as one
- If both `#skipExecution` and `#initOnly` are present, `#skipExecution` takes precedence (the module does not execute at all)

**Use Cases:**
- One-time setup or initialization logic that should run before the main cycle loop
- Compute derived values or perform setup operations that depend on other modules' initialized memory
- Initialize state that will be read by other modules during cycle execution

**Errors:**
- Using `#initOnly` outside of a module block (e.g., in `constants` or `function` blocks) will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error

**Example:**

```
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
```
module myModule
#skipExecution
#initOnly
int value 0
; ... code ...
moduleEnd
```

The `#skipExecution` directive takes precedence, and the module code does not execute during either init or cycle. This allows you to temporarily disable a module that was previously marked as init-only without removing the `#initOnly` directive.

### `#follow`

Constrains module memory layout so the current module must be placed immediately after another module, with no module in between.

**Scope:** Module blocks only

**Syntax:** `#follow <moduleId>`

**Usage:**
```
module foo
int a 1
moduleEnd

module bar
#follow foo
int b 2
moduleEnd
```

**Behavior:**
- Forces the current module to be laid out immediately after the target module in final memory order
- No unrelated module may appear between the target and the follower
- Chained follow directives form a single contiguous segment, for example `a -> b -> c`
- The final layout must still satisfy normal intermodule dependency ordering from memory declarations

**Use Cases:**
- Keep a group of related modules contiguous in memory
- Express layout-sensitive adjacency directly in source instead of relying on incidental alphabetical order
- Build explicit module chains whose physical order matters

**Errors:**
- Using `#follow` outside of a module block will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error
- Following a missing module will result in `MODULE_FOLLOW_TARGET_NOT_FOUND`
- Following the current module will result in `MODULE_FOLLOW_SELF`
- Declaring more than one `#follow` target in the same module will result in `MODULE_FOLLOW_MULTIPLE_TARGETS`
- If two modules both try to follow the same target, the compiler will throw `MODULE_FOLLOW_DUPLICATE_FOLLOWER`
- Cycles in follow constraints will result in `MODULE_FOLLOW_CYCLE`
- If a follow-chain would violate dependency ordering, the compiler will throw `MODULE_FOLLOW_DEPENDENCY_CONFLICT`

**Example:**

```
module alpha
int head 0
moduleEnd

module beta
#follow alpha
int middle 0
moduleEnd

module gamma
#follow beta
int tail 0
moduleEnd
```

In this example:
- `beta` must immediately follow `alpha`
- `gamma` must immediately follow `beta`
- the compiler treats the three modules as one contiguous layout segment: `alpha -> beta -> gamma`

## Module- and Function-Scoped Directives

### `#impure`

Marks the current function as allowed to perform explicit memory IO.

**Scope:** Function blocks only

**Usage:**
```
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
- Enables `load`, `load8s`, `load8u`, `load16s`, `load16u`, `loadFloat`, `store`, `storeBytes`, and pointer dereference forms such as `push *ptr` inside the current function
- Only permits address-driven memory access
- Does not allow direct module memory identifiers inside functions
- Does not allow memory declarations inside functions

**Errors:**
- Using `#impure` outside a function block results in an `IMPURE_DIRECTIVE_INVALID_CONTEXT` error
- Using memory IO in a function without `#impure` results in an `IMPURE_DIRECTIVE_REQUIRED_FOR_MEMORY_IO` error

### `#loopCap`

Sets the default loop cap for subsequent `loop` blocks in the current module or function block. The loop cap limits the maximum number of iterations to prevent infinite loops at runtime.

**Scope:** Module and function blocks

**Syntax:** `#loopCap <non-negative integer>`

**Usage:**
```
module myModule
#loopCap 5000
; ... loops after this line use a cap of 5000 ...
moduleEnd
```

**Behavior:**
- Sets the ambient loop cap for all `loop` instructions that follow in the same module or function body
- Only affects `loop` instructions that appear after the directive (single-pass compilation)
- A per-loop explicit argument (`loop <int>`) takes precedence over the ambient `#loopCap`
- When no `#loopCap` is present and no per-loop argument is given, the built-in default of `1000` applies
- The cap value `0` is valid and causes the loop guard to exit immediately on the first guard check
- Multiple `#loopCap` directives in the same block update the ambient default each time they appear

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
```
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
```
function int:int slowPath
#loopCap 2048
param int input
; loops inside this function default to 2048
push input
functionEnd
```

**Errors:**
- Using `#loopCap` outside of a module or function block (e.g., in `constants` blocks or at the top level before any `module`) will result in a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error
- Providing a non-integer, float, or negative integer argument is a syntax error detected by the tokenizer

## Error Handling

If an unknown compiler directive is encountered, the compiler will throw an `UNRECOGNISED_INSTRUCTION` error.

If a module-scoped directive like `#skipExecution`, `#initOnly`, or `#follow` is used outside of a module block, the compiler will throw a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error.

If `#loopCap` is used outside of a module or function block, the compiler will throw a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error.
