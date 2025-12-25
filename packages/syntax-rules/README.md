# @8f4e/syntax-rules

A package containing shared syntax validation and parsing utilities for the 8f4e language.

## Purpose

This package consolidates all syntax-related logic that was previously scattered across the `@8f4e/compiler` and `@8f4e/editor-state` packages. By centralizing syntax rules, we:

- Reduce code duplication
- Ensure consistent syntax handling across packages
- Make syntax rules easily reusable
- Decouple the editor from compiler implementation details

## Exported Functions

### Instruction Parsing

- `instructionParser` - Regular expression for parsing instruction lines
- `isComment(line: string)` - Checks if a line is a comment
- `isValidInstruction(line: string)` - Validates instruction syntax
- `parseArgument(argument: string)` - Parses instruction arguments (literals vs identifiers)

### Code Block Detection

- `getBlockType(code: string[])` - Detects if code is a module, config, function, or unknown
- `getModuleId(code: string[])` - Extracts module identifier from code
- `getFunctionId(code: string[])` - Extracts function identifier from code

### Variable Naming

- `isConstantName(name: string)` - Checks if a name follows constant naming conventions (uppercase)

## Types

- `ArgumentType` - Enum for LITERAL and IDENTIFIER argument types
- `Argument` - Union type for parsed arguments
- `ArgumentLiteral` - Type for literal arguments
- `ArgumentIdentifier` - Type for identifier arguments
- `CodeBlockType` - Union type for block types ('module' | 'config' | 'function' | 'unknown')

## Usage

```typescript
import {
	instructionParser,
	parseArgument,
	isComment,
	isValidInstruction,
	getBlockType,
	isConstantName,
} from '@8f4e/syntax-rules';

// Parse an instruction line
const line = 'push 42';
const match = line.match(instructionParser);

// Check if a line is a comment
if (isComment('; this is a comment')) {
	// Handle comment
}

// Parse an argument
const arg = parseArgument('0xFF'); // Returns { value: 255, type: 'literal', isInteger: true }

// Detect block type
const blockType = getBlockType(['module test', 'int x', 'moduleEnd']); // Returns 'module'

// Check constant naming
if (isConstantName('MAX_VALUE')) {
	// Name follows constant convention
}
```

## Development

### Build

```bash
npx nx run syntax-rules:build
```

### Test

```bash
npx nx run syntax-rules:test
```

## History

This package was created as part of an effort to decouple the editor and compiler packages (PR #197, TODO #148). The initial proof of concept moved `isConstantName` to this package, and subsequent work consolidated all syntax-related logic here.
