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

## Error Handling

If an unknown compiler directive is encountered, the compiler will throw an `UNRECOGNISED_INSTRUCTION` error.

If a module-scoped directive like `#skipExecution` or `#initOnly` is used outside of a module block, the compiler will throw a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error.
