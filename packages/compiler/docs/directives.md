# Compiler Directives

Compiler directives are special instructions prefixed with `#` that control compilation behavior without affecting runtime execution. They are distinct from regular instructions and are processed during the compilation phase.

## Directive Syntax

Directives start with a hash symbol (`#`) followed by the directive name:

```
#directiveName
```

Directives are case-sensitive and must be on their own line (though whitespace before the `#` is allowed).

## Available Directives

### `#skipExecution`

**Context:** Module blocks only

**Purpose:** Marks a module to be excluded from the global cycle dispatcher. The module is still fully compiled with memory allocation and initialization, but its cycle function will not be called during each execution cycle.

**Use cases:**
- Temporarily disabling a module without removing it from the codebase
- Creating data-only modules that other modules reference but don't execute
- Performance optimization by excluding unused modules from the execution loop

**Example:**

```
module dataProvider
#skipExecution
int sharedValue 42
int* pointer &otherModule.data
moduleEnd

module consumer
int* dataRef &dataProvider.sharedValue
; This module executes normally and can access dataProvider's memory
moduleEnd
```

**Behavior:**
- The module is compiled normally (full AST generation, memory map creation)
- Memory variables and their default values are allocated and initialized
- Inter-module memory references to the flagged module work correctly
- The module's cycle function is NOT called from the global cycle dispatcher
- Memory initialization (init function) still runs for the module
- Multiple `#skipExecution` directives in the same module are idempotent

**Restrictions:**
- Can only be used within module blocks
- Cannot be used in `function` or `constants` blocks
- Using in invalid contexts results in a compilation error

## Error Handling

### Unknown Directive

If an unknown directive is encountered, the compiler will throw an error:

```
module test
#unknownDirective  ; Error: Unknown compiler directive
moduleEnd
```

### Invalid Context

If a module-only directive is used in an invalid context (like in a function or constants block), the compiler will throw an error:

```
function myFunc
#skipExecution  ; Error: Compiler directive used in invalid context
functionEnd
```

## Difference from Comments

While both directives and comments use special prefixes, they serve different purposes:

- **Comments (`;`)**: Ignored entirely by the compiler, used for documentation
- **Directives (`#`)**: Processed by the compiler to control compilation behavior

```
; This is a comment - completely ignored
#skipExecution  ; This is a directive - changes compilation behavior
```
