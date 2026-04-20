# Repository Guidelines

## Package Scope & Layout
- Path: `packages/compiler/packages/symbols`; source in `src/`, output in `dist/` (ESM).
- Consumed via alias `@8f4e/compiler-symbols`.
- Owns symbol-pass work from tokenizer ASTs: constants, namespace imports, and symbol-only compile-time expression resolution.
- This package must not own memory metadata queries (`sizeof`, `count`, min/max, addresses) or layout-dependent validation.
- This package must not depend on `@8f4e/compiler` or `@8f4e/compiler-memory-layout`; those packages may depend on this package.

## Build, Test, Dev
- From root: `npx nx run @8f4e/compiler-symbols:build|test|typecheck`.
- Keep tests focused on symbol resolution, compile-time expression folding, namespace reference deferral, and generic memory-fact queries.

## Coding Style
- TypeScript (strict). Follow root formatting: tabs, single quotes, semicolons, width 120.
- Prefer tokenizer-owned AST and identifier classifications over reparsing source strings.
