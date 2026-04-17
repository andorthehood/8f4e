# WASM Utils Package Guidelines

This file extends the root and `packages/compiler/AGENTS.md` guidance for `packages/compiler/packages/wasm-utils`.

## Package Scope

- Package name: `@8f4e/compiler-wasm-utils`.
- Source lives in `src/`.
- This package owns low-level WebAssembly byte encoding helpers, instruction builders, section builders, and related structural utilities.
- Keep this package focused on deterministic byte construction utilities; higher-level compiler semantics belong in `@8f4e/compiler`.

## Commands

- From the repo root, prefer Nx:
  - `npx nx run @8f4e/compiler-wasm-utils:test`
  - `npx nx run @8f4e/compiler-wasm-utils:typecheck`
  - `npx nx run @8f4e/compiler-wasm-utils:lint`
  - `npx nx run @8f4e/compiler-wasm-utils:build`
- Keep the package build output in `dist/`; do not hand-edit generated output.

## Test Organization

Use classical Vitest test files with placement based on test scope.

- Keep colocated tests narrow and local:
  - Place `*.test.ts` next to the source file only when the test exercises that adjacent module directly.
  - These tests should be small unit tests for byte encoders, instruction builders, section builders, or similarly focused pure utilities.
  - Example: `src/encoding/unsignedLEB128.test.ts` tests `src/encoding/unsignedLEB128.ts`.
- Put broader tests in the package root `tests/` folder if they are added later:
  - Use `tests/*.test.ts` for package-level behavior, public API behavior, workflows, integration-style coverage, or tests spanning multiple source modules.
  - Keep snapshots for those tests under `tests/__snapshots__/`.
  - Keep larger fixtures or reusable test data under `tests/fixtures/`.
