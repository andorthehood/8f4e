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
- `activeModule` executes every cycle, incrementing its counter
- `disabledModule` does not execute, but its memory is initialized with `data = 42`
- `consumer` can access `disabledModule:data` even though `disabledModule` doesn't execute

## Error Handling

If an unknown compiler directive is encountered, the compiler will throw an `UNKNOWN_COMPILER_DIRECTIVE` error.

If a module-scoped directive like `#skipExecution` is used outside of a module block, the compiler will throw a `COMPILER_DIRECTIVE_INVALID_CONTEXT` error.
