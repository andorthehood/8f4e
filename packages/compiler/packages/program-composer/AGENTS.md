# Program Composer Package Guidelines

This file extends the root and `packages/compiler/AGENTS.md` guidance for
`packages/compiler/packages/program-composer`.

## Package Scope

- Package name: `@8f4e/program-composer`.
- Own recursive `ProjectObjectModel` traversal, per-project cache namespaces, internal symbol qualification, and
  deterministic module execution order.
- Produce one composed validated-AST program for the compiler's global semantic, allocation, and code-generation pass.
- Keep the canonical source object model in `@8f4e/language-spec`; do not introduce another source representation.
- Keep memory planning, function/type indexing, semantic resolution, and WebAssembly emission outside this package.
- Nested projects are isolated namespaces. Their modules run before their parent project's modules for the same entry.
- Keep source-shaped integration fixtures and their file snapshots under `tests/`; keep `src/` limited to package code.

## Commands

- From the repository root, prefer Nx:
  - `npx nx run @8f4e/program-composer:build`
  - `npx nx run @8f4e/program-composer:typecheck`
  - `npx nx run @8f4e/program-composer:test`
  - `npx nx run @8f4e/program-composer:lint`
