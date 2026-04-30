# Repository Guidelines

## Package Scope & Layout
- Path: `packages/compiler`; source in `src/`, output in `dist/` (ESM).
- Consumed via alias `@8f4e/compiler`.
- Compiles custom assembly language into WebAssembly bytecode.
- Supports modules (stateful, with memory) and pure functions (stateless, stack-only).
- Syntax parsing now lives in the nested subpackage `@8f4e/tokenizer` (`packages/compiler/packages/tokenizer`).
- `@8f4e/compiler` should consume parsed AST input and semantic/codegen utilities, not source-to-AST parsing helpers.

## Build, Test, Dev
- From root: `npx nx run compiler:build|test|typecheck`.
- From package directory: use `npx nx run compiler:<target>` (e.g., `npx nx run compiler:dev`).
- JS output is bundled with Vite; declarations are emitted separately with `tsc --emitDeclarationOnly`.
- Artifacts in `dist/` must exist before root Vite build when APIs change.

## Coding Style
- TypeScript (strict). ESLint + `@typescript-eslint` and `import/order`.
- Use ESLint as the fixer (`npx eslint --fix <files>`); it owns formatting rules such as tabs, single quotes, semicolons, width 120, and trailing commas.

## Testing
- Vitest (via Nx). Keep narrow unit tests colocated with the source under test using `*.test.ts` or `__tests__/`.
- Put broader compiler behavior, multi-module, integration-style, and generic regression coverage in `tests/`.
- Focus on deterministic, fast tests for semantic analysis, IR, transforms, and codegen behavior.
- Syntax/parser in-source tests live with `@8f4e/tokenizer`; compiler tests should focus on semantic and codegen behavior.
- To update snapshots after intentional changes, use `npx nx run compiler:test -- --update`.

## Function Purity and `#impure`

### Overview
The compiler now supports pure functions alongside modules. Functions are pure by default and may opt into explicit memory IO with `#impure`.
- **Pure by default**: No memory IO, only stack and locals
- **Impure by directive**: `#impure` allows explicit address-driven reads/writes
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
- **No memory declarations in functions**: Functions cannot declare `int`, `float`, pointers, or buffers
- **Pure by default**: `load`, `store`, `storeBytes`, and pointer dereference require `#impure`
- **No direct module memory namespace access**: Even impure functions still operate only on explicit addresses
- **Stack-only operations**: Supports locals, constants, arithmetic, logic, control flow

### Allowed Instructions in Functions
- **Arithmetic**: `add`, `sub`, `mul`, `div`, `remainder`, `min`, `max`, `abs`, `sqrt`, `pow2`, `round`
- **Logic**: `and`, `or`, `xor`, `equal`, `equalToZero`, `greaterThan`, `lessThan`, `greaterOrEqual`, `lessOrEqual`
- **Stack**: `push`, `dup`, `drop`, `swap`, `clearStack`
- **Locals**: `local`, `localSet`
- **Control flow**: `if`, `ifEnd`, `else`, `loop`, `loopEnd`, `block`, `blockEnd`, `branch`, `branchIfTrue`
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
  if
    drop
    push temp
  ifEnd int
  
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

## Error Domains

The compiler uses two separate error modules. **Always choose based on detection phase**:

| Phase | Module | Class / Function | When to use |
|-------|--------|-----------------|-------------|
| Syntax | `@8f4e/tokenizer` | `SyntaxRulesError` / `SyntaxErrorCode` | Error detectable from token/argument shape alone, before semantic context |
| Semantic | `src/compilerError.ts` | `getError` / `ErrorCode` | Error requires symbol resolution, scope, stack state, type checking, or compiler state |

**Syntax error examples**: malformed literal, missing required argument, invalid pointer-depth, invalid string encoding, mixed byte-literal tokens.

**Compiler error examples**: undeclared identifier, type mismatch, stack mismatch, illegal memory access in pure function, duplicate declarations.

**Default messages** are centrally defined in each module's registry. Throw sites should omit the `message` argument unless dynamic context adds value (e.g. `INVALID_STRING_LITERAL` includes the bad escape sequence).

## Internal Stage Contract Rule

For compiler internals, do not re-validate argument arity or argument shape at every phase once those properties were already guaranteed earlier in the pipeline.

Use this rule:

- Tokenizer owns syntax validation, including instruction arity and raw argument shape.
- Semantic normalization may transform AST lines into narrower internal forms.
- Downstream compiler phases should trust validated and normalized internal data.
- Internal transformation code should be verified with tests and static types, not repeated runtime guards.

This means:

- Do **not** add defensive runtime checks for argument-shape states that can only happen if compiler-owned normalization/manipulation code is wrong.
- Do **not** compensate for broad internal types by repeatedly checking the same invariant in semantic/codegen steps.
- If a phase requires a narrower shape, encode that requirement in the type boundary and route only the correct staged type there.

Exception:

- Runtime validation is still appropriate for real semantic/codegen concerns that depend on program state rather than token shape, such as stack validity, resolved type compatibility, scope legality, or symbol existence when that ownership has not yet been moved earlier.

## Commits & PRs
- Commits: `compiler: <scope> <change>` (e.g., `compiler: parser fix for arrays`).
- PRs: include rationale, test coverage notes, and linked issues.
