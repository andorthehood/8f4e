# @8f4e/stack-config-compiler

A stack-machine-inspired config language compiler for 8f4e. Parses and executes stack-based config programs to produce JSON objects.

## Installation

This is an internal package of the 8f4e monorepo. It's available via workspace references:

```json
{
  "dependencies": {
    "@8f4e/stack-config-compiler": "*"
  }
}
```

## Usage

```typescript
import { compileConfig } from '@8f4e/stack-config-compiler';

const source = `
; A simple instrument configuration
scope "instrument.name"
push "Piano"
set

rescopeTop "volume"
push 0.8
set

rescopeTop "tags"
push "keyboard"
push "acoustic"
set
`;

const result = compileConfig(source);

if (result.errors.length === 0) {
  console.log(result.config);
  // Output:
  // {
  //   instrument: {
  //     name: "Piano",
  //     volume: 0.8,
  //     tags: ["keyboard", "acoustic"]
  //   }
  // }
} else {
  console.error('Compilation errors:', result.errors);
}
```

## Language Specification

See [`docs/brainstorming_notes/013-stack-oriented-config-language.md`](../../docs/brainstorming_notes/013-stack-oriented-config-language.md) for the complete language specification.

### Commands

| Command | Description |
|---------|-------------|
| `push <literal>` | Push a literal (string, number, boolean, null) onto the data stack |
| `set` | Pop all values from the stack and set them at the current scope path |
| `append` | Pop all values and append them to an array at the current scope path |
| `scope <path>` | Push path segments onto the scope stack |
| `rescopeTop <path>` | Replace the top scope segment with new path segments |
| `rescope <path>` | Replace the entire scope stack with new path segments |
| `endScope` | Pop one segment from the scope stack |

### Literals

- **Strings**: `"hello"`, `"He said \"hello\""` (with escape sequences)
- **Numbers**: `123`, `0.5`, `-2.3`
- **Booleans**: `true`, `false`
- **Null**: `null`

### Path Syntax

Paths support dot notation and array indices:

```
scope "key"
scope "parent.child"
scope "arrayKey[0]"
scope "parent.array[3].child"
```

### Comments

Lines starting with `;` are treated as comments. **Note:** Inline comments are not supported.

```
; This is a comment
scope "name"
push "value"
set

; Comments must be on their own line
; push "unused"  ; This entire line is a comment
```

## API

### `compileConfig(source: string): CompileResult`

Compiles a stack config source program into a JSON-compatible object.

**Parameters:**
- `source` - The source code in stack config language (one command per line)

**Returns:**
- `config` - The resulting JSON-compatible object, or `null` if there were errors
- `errors` - An array of error objects with `line` (1-based) and `message` properties

## Error Handling

The compiler reports errors with precise line numbers:

```typescript
const result = compileConfig(`
scope "test"
unknownCommand
push "value"
set
`);

// result.errors = [{ line: 3, message: "Unknown command: unknownCommand" }]
// result.config = null
```

## Status

⚠️ **Experimental** - This package is under active development. The API and language semantics may change.

## Related

- [Language Specification](../../docs/brainstorming_notes/013-stack-oriented-config-language.md)
- [TODO Document](../../docs/todos/107-stack-config-compiler-package.md)
