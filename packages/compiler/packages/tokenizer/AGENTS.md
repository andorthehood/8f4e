# Tokenizer Package Guidelines

This file extends the root and `packages/compiler/AGENTS.md` guidance for `packages/compiler/packages/tokenizer`.

## Package Scope

- Package name: `@8f4e/tokenizer`.
- Source lives in `src/`; package-level behavioral tests live in `tests/`.
- The tokenizer owns source-to-AST parsing and syntax-level validation that can be decided from token or argument shape alone.
- Do not add compiler semantic checks here if they require symbol resolution, scope, stack state, type checking, or other compiler state.

## Commands

- From the repo root, prefer Nx:
  - `npx nx run @8f4e/tokenizer:test`
  - `npx nx run @8f4e/tokenizer:typecheck`
  - `npx nx run @8f4e/tokenizer:lint`
  - `npx nx run @8f4e/tokenizer:build`
- Keep the package build output in `dist/`; do not hand-edit generated output.

## Test Organization

Use classical Vitest test files with placement based on test scope.

- Keep colocated tests narrow and local:
  - Place `*.test.ts` next to the source file only when the test exercises that adjacent module directly.
  - These tests should be small unit tests for pure helpers, regex classifiers, argument parsers, or similarly focused syntax utilities.
  - Example: `src/syntax/parseNumericLiteralToken.test.ts` tests `src/syntax/parseNumericLiteralToken.ts`.
- Put broader tests in the package root `tests/` folder:
  - Use `tests/*.test.ts` for package-level behavior, public API behavior, parser/AST workflows, integration-style coverage, or tests spanning multiple source modules.
  - Keep snapshots for those tests under `tests/__snapshots__/`.
  - Keep larger fixtures or reusable test data under `tests/fixtures/` if they are added later.

## Syntax Error Ownership

- Syntax errors belong in `src/syntax/syntaxError.ts`.
- Each syntax error code should own its default message in the central registry.
- Throw sites should omit custom messages unless dynamic context is needed.
