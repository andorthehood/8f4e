# Macro Expansion Feature

This directory contains the implementation of the macro expansion system for the 8f4e editor.

## Overview

The macro expansion feature allows users to define reusable code snippets in dedicated `macro` blocks and reference them in other code blocks using `macro <name>` instructions. During compilation, these references are expanded inline, and any errors are correctly mapped back to the call site.

## Architecture

### Core Components

1. **extractMacroBody.ts**: Extracts macro name and body from `defmacro`/`defmacroEnd` blocks
2. **collectMacros.ts**: Gathers all macro definitions and validates uniqueness
3. **expandMacros.ts**: Replaces `macro <name>` call sites with macro bodies
4. **remapErrors.ts**: Remaps compiler errors from expanded lines to original call-site lines
5. **types.ts**: TypeScript definitions for macro expansion

### Integration Points

- **Program Compiler** (`features/program-compiler/effect.ts`): Applies macro expansion before WASM compilation
- **Config Compiler** (`features/config-compiler/`): Applies macro expansion before config compilation

## Usage

### Defining a Macro

```
defmacro initBuffer
  push 0
  set bufferPtr
defmacroEnd
```

### Using a Macro

In any block type (module, config, function, constants):

```
module myModule
  macro initBuffer
  push 100
  add
moduleEnd
```

This expands to:

```
module myModule
  push 0
  set bufferPtr
  push 100
  add
moduleEnd
```

## Features

- ✅ Works in all block types (module, config, function, constants)
- ✅ Validates unique macro names
- ✅ Reports missing macro references as errors
- ✅ Line mapping for accurate error attribution
- ✅ Empty macro bodies supported
- ❌ Nested/recursive macros not supported

## Error Handling

### Duplicate Macro Names

When two macros with the same name are defined, an error is reported:

```
Error: Duplicate macro definition: "myMacro" is already defined
```

### Undefined Macros

When a macro is referenced but not defined, an error is reported:

```
Error: Undefined macro: "undefinedMacro"
```

### Compiler Errors

When a compiler error occurs in expanded code, it's remapped to the call site:

```
// Macro definition
defmacro badCode
  invalid instruction
defmacroEnd

// Usage at line 5
macro badCode

// Error reports line 5, not the expanded line
Error at line 5: Unknown instruction "invalid"
```

## Testing

The macro expansion system has comprehensive test coverage:

- Unit tests for each component
- Integration tests for end-to-end scenarios
- Tests for error cases and edge conditions
- Total: 7 integration tests + unit tests in each module

Run tests with:
```bash
npx nx test @8f4e/editor-state --testPathPattern="macro"
```

## Implementation Details

### Line Mapping Strategy

Each macro expansion builds a mapping table:

```typescript
interface LineMapping {
  expandedLineNumber: number;      // Line in expanded code
  originalLineNumber: number;      // Original call-site line
  originalBlockId: string | number; // Block containing the call
}
```

When a compiler error occurs at an expanded line, we look up the mapping to find the original call-site location.

### Compilation Flow

1. Collect all macro definitions from `macro` blocks
2. Validate no duplicate names
3. For each non-macro block:
   - Expand all `macro <name>` instructions
   - Build line mapping table
   - Pass expanded code to compiler
4. If compilation errors occur:
   - Remap error lines using the mapping table
   - Report errors at original call sites

## Future Enhancements

Potential future improvements (not currently implemented):

- Macro parameters/arguments
- Nested macro expansion
- Macro imports/exports between projects
- Macro debugging tools
- Macro usage analytics
