# Macros

Macros provide a way to define reusable code snippets that are expanded at compile time. They help reduce code duplication without the overhead of function calls.

## Macro Instructions

### defineMacro

The `defineMacro` instruction begins a macro definition block. Macros are defined separately from modules and functions.

**Syntax:**
```
defineMacro <name>
```

**Parameters:**
- `name` - Unique identifier for the macro

**Notes:**
- Macros must be defined in dedicated macro blocks (not inside modules or functions)
- Each macro definition must end with `defineMacroEnd`
- Macro names must be unique across all macros
- Macros cannot be nested within other macros

### defineMacroEnd

The `defineMacroEnd` instruction ends a macro definition block.

**Syntax:**
```
defineMacroEnd
```

### macro

The `macro` instruction expands a previously defined macro at the call site. The macro's body is inserted inline, replacing the `macro` instruction.

**Syntax:**
```
macro <name>
```

**Parameters:**
- `name` - Name of the macro to expand

**Notes:**
- Macro expansion happens at compile time, before the main compilation phase
- Macros are collected from all macro blocks first, so they can be used regardless of definition order
- Errors in expanded macro code are reported at the macro call site
- Recursive macro expansion is not supported

## Examples

### Basic macro definition and usage

Define a macro to double a value:

```
defineMacro double
push 2
mul
defineMacroEnd
```

Use it in a module:

```
module example
int counter 5
push counter
macro double
drop
moduleEnd
```

This expands to:

```
module example
int counter 5
push counter
push 2
mul
drop
moduleEnd
```

### Multiple macros

You can define multiple macros in separate blocks:

**First macro block:**
```
defineMacro triple
push 3
mul
defineMacroEnd
```

**Second macro block:**
```
defineMacro square
dup
mul
defineMacroEnd
```

And use them in functions:

```
function calculate
param int x
localGet x
macro triple
macro square
functionEnd int
```

## Error Handling

The compiler validates macro usage and provides specific error codes:

- **DUPLICATE_MACRO_NAME** - Two macros have the same name
- **MISSING_MACRO_END** - A macro definition is not closed with `defineMacroEnd`
- **UNDEFINED_MACRO** - Attempting to expand a macro that hasn't been defined
- **NESTED_MACRO_DEFINITION** - Attempting to define a macro inside another macro
- **NESTED_MACRO_CALL** - Attempting to call a macro inside a macro definition

## Best Practices

1. **Keep macros simple** - Macros are best for small, frequently used code patterns
2. **Use descriptive names** - Make macro names clear and self-documenting
3. **Consider functions for complex logic** - If the code is complex or needs parameters, use functions instead
4. **One macro per block** - Each macro definition requires its own dedicated block
5. **Document macro behavior** - Add comments explaining what each macro does

## Limitations

- No macro parameters (use functions if you need parameters)
- No recursive expansion (macros cannot call themselves or other macros in the current implementation)
- No conditional expansion (macros always expand the same way)
- Macros cannot contain `defineMacro` or `macro` instructions in their body
