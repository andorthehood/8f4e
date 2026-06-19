# Repository Guidelines

## Package Scope & Layout
- Path: `packages/compiler`; source in `src/`, output in `dist/` (ESM).
- Consumed via alias `@8f4e/compiler`.
- Compiles custom assembly language into WebAssembly bytecode.
- Supports modules (stateful, with memory) and pure functions (stateless, stack-only).
- Shared language contracts live in the nested standalone subpackage `@8f4e/language-spec` (`packages/compiler/packages/language-spec`).
- Include-only source resolution lives in the nested standalone subpackage `@8f4e/include-resolver` (`packages/compiler/packages/include-resolver`).
- Syntax parsing now lives in the nested subpackage `@8f4e/tokenizer` (`packages/compiler/packages/tokenizer`).
- Project preparsing lives in the nested standalone subpackage `@8f4e/project-preparser` (`packages/compiler/packages/project-preparser`).
- Standard library sources live in the nested source package `@8f4e/stdlib` (`packages/compiler/packages/stdlib`).

## Build, Test, Dev
- From root: `npx nx run compiler:build|test|typecheck`.
- From package directory: use `npx nx run compiler:<target>` (e.g., `npx nx run compiler:dev`).
- JS output is bundled with Vite; declarations are emitted separately with `tsc --emitDeclarationOnly`.
- Artifacts in `dist/` must exist before root Vite build when APIs change.

## Coding Style
- TypeScript (strict). Use Biome for linting and import organization.
- Use Biome as the fixer (`npx biome check --write <files>`);

## Testing
- Vitest (via Nx). Keep narrow unit tests colocated with the source under test using `*.test.ts` or `__tests__/`.
- Put broader compiler behavior, multi-module, integration-style, and generic regression coverage in `tests/`.
- Syntax/parser in-source tests live with `@8f4e/tokenizer`; compiler tests should focus on semantic and codegen behavior.
- To update snapshots after intentional changes, use `npx nx run compiler:test -- --update`.

### Examples

#### Example 1: Simple arithmetic helper
```
function average
  param int a
  param int b
  push a
  push b
  add
  push 2
  div
functionEnd int
```

#### Example 2: Using local variables
```
function clampMin
  param int value
  param int minValue
  local int result
  
  push value
  localSet result

  push value
  push minValue
  lessThan
  if
    push minValue
    localSet result
  ifEnd
  
  push result
functionEnd int
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
