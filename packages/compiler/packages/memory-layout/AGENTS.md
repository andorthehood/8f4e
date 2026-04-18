# Repository Guidelines

## Package Scope & Layout
- Path: `packages/compiler/packages/memory-layout`; source in `src/`, output in `dist/` (ESM).
- Consumed via alias `@8f4e/compiler-memory-layout`.
- Owns public module memory layout generation from tokenizer ASTs.
- This package must not depend on `@8f4e/compiler`; the compiler depends on this package.

## Build, Test, Dev
- From root: `npx nx run @8f4e/compiler-memory-layout:build|test|typecheck`.
- Keep tests focused on public memory layout behavior: addresses, module sizes, intermodule references, defaults, and exclusion of codegen-only hidden allocations.

## Coding Style
- TypeScript (strict). Follow root formatting: tabs, single quotes, semicolons, width 120.
- Prefer AST/tokenizer-owned classifications over reparsing source strings.

