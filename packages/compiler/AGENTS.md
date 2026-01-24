# Repository Guidelines

## Package Scope & Layout
- Path: `packages/compiler`; source in `src/`, output in `dist/` (ESM).
- Consumed via alias `@8f4e/compiler`.
- Compiles custom assembly language into WebAssembly bytecode.
- Supports modules (stateful, with memory) and pure functions (stateless, stack-only).
- **Subpath exports**:
  - `@8f4e/compiler` - Main compiler API
  - `@8f4e/compiler/syntax` - Syntax helpers only (no compiler dependencies)

## Syntax Subpath Export
- The `@8f4e/compiler/syntax` subpath provides syntax parsing utilities without the full compiler.
- Located in `src/syntax/` and built to `dist/syntax/`.
- Includes: `instructionParser`, `isConstantName`, `parseArgument`, `getBlockType`, `getModuleId`, `getFunctionId`, memory helpers, and syntax errors.
- Use for lightweight syntax checking, parsing, or IDE support without bundling the entire compiler.

## Build, Test, Dev
- From root: `npx nx run compiler:build|test|typecheck`.
- From package directory: use `npx nx run compiler:<target>` (e.g., `npx nx run compiler:dev`).
- Artifacts in `dist/` must exist before root Vite build when APIs change.

## Coding Style
- TypeScript (strict). ESLint + `@typescript-eslint` and `import/order`.
- Prettier: tabs, single quotes, semi, width 120, trailing commas.

## Testing
- Vitest (via Nx). Place tests in `tests/`, `__tests__/`, or `*.test.ts`.
- Focus on deterministic, fast unit tests for parsing, IR, and transforms.
- In-source tests (`import.meta.vitest`) are enabled for `src/syntax/**/*.ts` via Vitest config.
- To update snapshots after intentional changes, use `npx nx run compiler:test -- --update`.

## Pure Function Feature

### Overview
The compiler now supports pure functions alongside modules. Pure functions are:
- **Stateless**: No memory access, only stack and locals
- **Reusable**: Can be called from multiple modules
- **Type-safe**: Explicit signatures with int/float parameters and returns
- **Compiled once**: Shared across all modules that call them

### Syntax

#### Function Declaration
```
function <name> [<param1Type> <param2Type> ...]
  ; function body (stack-only operations)
functionEnd [<return1Type> <return2Type> ...]
```

#### Calling Functions
```
module myModule
  loop
    push 5
    call square  ; Call a defined function
    drop
  loopEnd
moduleEnd
```

### Constraints
- **Parameters**: Maximum 8, types must be `int` or `float`
- **Returns**: Maximum 8, types must be `int` or `float`
- **No memory access**: Cannot use `int`, `float`, `int*`, `float*`, `int**`, `float**`, buffers, `load`, `store`
- **Stack-only operations**: Supports locals, constants, arithmetic, logic, control flow

### Allowed Instructions in Functions
- **Arithmetic**: `add`, `sub`, `mul`, `div`, `remainder`, `abs`, `sqrt`, `pow2`, `round`
- **Logic**: `and`, `or`, `xor`, `equal`, `equalToZero`, `greaterThan`, `lessThan`, `greaterOrEqual`, `lessOrEqual`
- **Stack**: `push`, `dup`, `drop`, `swap`, `clearStack`
- **Locals**: `local`, `localGet`, `localSet`
- **Control flow**: `if`, `ifEnd`, `else`, `loop`, `loopEnd`, `block`, `blockEnd`, `branch`, `branchIfTrue`, `branchIfUnchanged`, `skip`
- **Type conversion**: `castToInt`, `castToFloat`
- **Bitwise**: `shiftLeft`, `shiftRight`, `shiftRightUnsigned`
- **Constants**: `const` (can be defined at top level or in function body)

### API Usage

```typescript
import compile from '@8f4e/compiler';

// Define pure functions
const functions = [
  {
    code: [
      'function square int',
      'dup',
      'mul',
      'functionEnd int'
    ]
  },
  {
    code: [
      'function add int int',
      'add',
      'functionEnd int'
    ]
  }
];

// Define modules that use functions
const modules = [
  {
    code: [
      'module test',
      'loop',
      'push 5',
      'call square',
      'drop',
      'loopEnd',
      'moduleEnd'
    ]
  }
];

const options = {
  startingMemoryWordAddress: 1,
  memorySizeBytes: 65536,
  environmentExtensions: {
    constants: {},
    ignoredKeywords: []
  }
};

const result = compile(modules, options, functions);

// Access compiled functions
console.log(result.compiledFunctions);
// {
//   square: { id: 'square', signature: { parameters: ['int'], returns: ['int'] }, ... },
//   add: { id: 'add', signature: { parameters: ['int', 'int'], returns: ['int'] }, ... }
// }

// Access WASM bytecode
console.log(result.codeBuffer);
```

### Examples

#### Example 1: Simple arithmetic helper
```
function average int int
  add
  push 2
  div
functionEnd int
```

#### Example 2: Using local variables
```
function clamp int int int
  ; Parameters: value, min, max
  local int temp
  
  ; Compare value with min
  swap
  dup
  localSet temp
  lessThan
  if int
    drop
    localGet temp
  ifEnd
  
  ; Compare with max
  ; (implementation continues...)
functionEnd int
```

#### Example 3: Multiple return values
```
function divMod int int
  ; Returns quotient and remainder
  swap
  dup
  dup
  dup
  div
  swap
  remainder
functionEnd int int
```

## Commits & PRs
- Commits: `compiler: <scope> <change>` (e.g., `compiler: parser fix for arrays`).
- PRs: include rationale, test coverage notes, and linked issues.
