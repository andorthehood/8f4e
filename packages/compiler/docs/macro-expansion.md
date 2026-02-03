# Macro Expansion Feature - Usage Examples

## Overview
The compiler now supports macro expansion for reusable code snippets. Macros are preprocessed and expanded before compilation, with errors correctly mapped to the call site.

## Syntax

### Define a Macro
```
defineMacro <name>
  ; macro body
  ; can contain multiple instructions
defineMacroEnd
```

### Use a Macro
```
macro <name>
```

## Example 1: Simple Increment Macro

```
defineMacro increment
push 1
add
defineMacroEnd

module counter
int value 0

; Use the macro
push value
push 5
macro increment  ; Expands to: push 1 \n add
store

moduleEnd
```

## Example 2: Multiple Macros

```
defineMacro loadX
push x
load
defineMacroEnd

defineMacro storeX
push x
store
defineMacroEnd

module test
int x 10

macro loadX
push 1
add
macro storeX

moduleEnd
```

## Example 3: Error Reporting

When an error occurs in expanded macro code, the error points to the `macro <name>` call site, not the macro definition:

```
defineMacro buggy
push undefined_var  ; This will error
defineMacroEnd

module test
macro buggy  ; <- Error will be reported at this line
moduleEnd
```

Error message: `Undeclared identifier. (9)` pointing to the `macro buggy` line.

## Restrictions

1. **No Duplicate Names**: Each macro must have a unique name
2. **No Nesting**: Cannot define macros inside other macros
3. **No Recursion**: Macros cannot call other macros (including themselves)
4. **Must Close**: Every `defineMacro` must have a matching `defineMacroEnd`

## Error Messages

- `DUPLICATE_MACRO_NAME` - Macro name already defined
- `MISSING_MACRO_END` - defineMacro without defineMacroEnd
- `UNDEFINED_MACRO` - Attempting to use undefined macro
- `NESTED_MACRO_DEFINITION` - defineMacro inside a macro body
- `MACRO_CALL_IN_MACRO_BODY` - macro call inside a macro body

## Implementation Details

- Macros are expanded during the `compileToAST()` phase
- Line numbers in the AST preserve the call site for error reporting
- Comments inside macros are preserved
- The feature is backward compatible - code without macros works unchanged
