# @8f4e/stack-config-compiler

A stack-machine-inspired config language compiler for 8f4e. Parses and executes stack-based config programs to produce JSON objects. Optionally validates the resulting config against a JSON Schema.

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
| `concat` | Concatenate all stack values into a single string (using `String()` coercion) |
| `scope <path>` | Push path segments onto the scope stack |
| `rescopeTop <path>` | Replace the top scope segment with new path segments |
| `rescope <path>` | Replace the entire scope stack with new path segments |
| `rescopeSuffix <path>` | Replace the trailing suffix of the scope stack with new path segments |
| `popScope` | Pop one segment from the scope stack |

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

### Suffix Rescoping

The `rescopeSuffix` command replaces the trailing suffix of the current scope with a new suffix. The number of segments replaced equals the number of segments in the argument path.

```
; Replace suffix example
scope "icons.piano.title"
push "Piano Icon"
set

rescopeSuffix "harp.title"
push "Harp Icon"
set
; Result: { icons: { piano: { title: "Piano Icon" }, harp: { title: "Harp Icon" } } }

; Array index example
scope "settings.runtime[0].config"
push "dev"
set

rescopeSuffix "runtime[1].config"
push "prod"
set
; Result: { settings: { runtime: [{ config: "dev" }, { config: "prod" }] } }
```

This is useful for transforming related paths without losing the common prefix, making config programs more composable and readable.

### String Concatenation

The `concat` command joins all values on the stack into a single string. Non-string values are coerced via `String()`.

```
scope "message"
push "Hello, "
push "World"
push "!"
concat
set
; Result: { message: "Hello, World!" }

; Coercion example
scope "info"
push "Count: "
push 42
concat
set
; Result: { info: "Count: 42" }
```

### Comments

Lines starting with `;` are treated as comments. Inline comments are also supported at the end of lines.

```
; This is a comment
scope "name"
push "value" ; This is an inline comment
set

; This is a full-line comment
push "unused" ; This value is unused
```

## API

### `compileConfig(source: string, options?: CompileOptions): CompileResult`

Compiles a stack config source program into a JSON-compatible object.

**Parameters:**
- `source` - The source code in stack config language (one command per line)
- `options` - Optional configuration object
  - `schema` - A JSON Schema object to validate the resulting config against

**Returns:**
- `config` - The resulting JSON-compatible object, or `null` if there were errors
- `errors` - An array of error objects

### Error Object Properties

Each error object contains:
- `line` - 1-based line number where the error occurred
- `message` - Human-readable error description
- `kind` - Error category: `'parse'`, `'exec'`, or `'schema'`
- `path` - (schema errors only) The config path where the error occurred

## Schema Validation

The compiler supports optional JSON Schema validation to catch configuration mistakes early with precise error messages.

### Supported JSON Schema Features

The v1 implementation supports a focused subset of JSON Schema:

- `type`: `string`, `number`, `boolean`, `null`, `object`, `array`
- `enum`: Allowed values for primitive types
- `properties`: Object property definitions
- `required`: Required object properties
- `items`: Array item schema
- `additionalProperties`: Control whether extra keys are allowed (boolean or schema)
- `oneOf`: Exactly one alternative must match (for discriminated unions)
- `anyOf`: At least one alternative must match (for overlapping types)

### Schema Validation Example

```typescript
import { compileConfig } from '@8f4e/stack-config-compiler';

const schema = {
  type: 'object',
  properties: {
    projectInfo: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        author: { type: 'string' },
        version: { type: 'number' }
      },
      required: ['title'],
      additionalProperties: false
    },
    settings: {
      type: 'object',
      properties: {
        runtime: { type: 'number', enum: [0, 1, 2] }
      }
    }
  },
  required: ['projectInfo']
};

const source = `
scope "projectInfo.title"
push "My Project"
set

rescope "projectInfo.author"
push "Alice"
set
`;

const result = compileConfig(source, { schema });

if (result.errors.length === 0) {
  console.log(result.config);
} else {
  console.error('Validation errors:', result.errors);
}
```

### Error Semantics

Schema validation produces errors at specific locations:

1. **Navigation errors** (unknown keys, invalid paths):
   - Reported at the line of the `scope` / `rescope` / `rescopeTop` command
   - Example: `Unknown key "titel". Known keys: title, author`

2. **Value errors** (type mismatch, enum violation):
   - Reported at the line of the `set` / `append` command
   - Example: `Expected type number, got string`

3. **Missing required fields**:
   - Reported at line 1 (program start)
   - Example: `Missing required field "projectInfo.title"`

### Catching Common Mistakes

Schema validation catches:

- **Typos in keys**: `scope "titel"` when schema only allows `title`
- **Type mismatches**: `push "hello"` into a number field
- **Invalid enum values**: `push 5` when enum only allows `[0, 1, 2]`
- **Missing required fields**: Forgetting to set a required config value

### Conditional Schemas with oneOf/anyOf

The compiler supports conditional validation using `oneOf` and `anyOf` combinators, enabling runtime-specific validation.

#### Example: Runtime-Specific Configuration

```typescript
import { compileConfig } from '@8f4e/stack-config-compiler';

// Schema with oneOf for discriminated union based on runtime type
const schema = {
  type: 'object',
  properties: {
    config: {
      type: 'object',
      oneOf: [
        {
          // Audio runtime configuration
          properties: {
            runtime: { type: 'string', enum: ['audio'] },
            audioOutputBuffers: { type: 'number' }
          },
          required: ['runtime', 'audioOutputBuffers'],
          additionalProperties: false
        },
        {
          // MIDI runtime configuration
          properties: {
            runtime: { type: 'string', enum: ['midi'] },
            midiNoteInputs: { type: 'number' }
          },
          required: ['runtime', 'midiNoteInputs'],
          additionalProperties: false
        }
      ]
    }
  }
};

// Valid audio runtime config
const audioSource = `
scope "config.runtime"
push "audio"
set

rescope "config.audioOutputBuffers"
push 2
set
`;

const result = compileConfig(audioSource, { schema });
// result.config = { config: { runtime: 'audio', audioOutputBuffers: 2 } }
// result.errors = []
```

#### oneOf vs anyOf

- **`oneOf`**: Exactly one alternative must match. Best for discriminated unions where you have mutually exclusive configurations (e.g., different runtime types). If zero or multiple alternatives match, validation fails.

- **`anyOf`**: At least one alternative must match. Best for overlapping schemas where multiple valid structures are acceptable (e.g., a field that accepts either a string or a number).

**Example with anyOf:**

```typescript
const schema = {
  type: 'object',
  properties: {
    value: {
      anyOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    }
  }
};

// Both are valid
compileConfig('scope "value"\npush "hello"\nset', { schema }); // ✓
compileConfig('scope "value"\npush 42\nset', { schema }); // ✓
compileConfig('scope "value"\npush true\nset', { schema }); // ✗ Error
```

## Error Handling

The compiler reports errors with precise line numbers:

```typescript
const result = compileConfig(`
scope "test"
unknownCommand
push "value"
set
`);

// result.errors = [{ line: 3, message: "Unknown command: unknownCommand", kind: "parse" }]
// result.config = null
```

## Status

⚠️ **Experimental** - This package is under active development. The API and language semantics may change.

## Related

- [Language Specification](../../docs/brainstorming_notes/013-stack-oriented-config-language.md)
- [Schema Validation Design](../../docs/brainstorming_notes/014-stack-config-schema-validation.md)
- [TODO Document](../../docs/todos/107-stack-config-compiler-package.md)
