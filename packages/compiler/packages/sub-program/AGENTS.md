# Sub-program Package Guidelines

This file extends the root and `packages/compiler/AGENTS.md` guidance for
`packages/compiler/packages/sub-program`.

## Package Scope

- Package name: `@8f4e/sub-program`.
- Owns private orchestration of all passes that compile one closed `ProjectObjectModel` into `CompiledSubProgram`.
- This package is an internal compiler stage. Consumers use `parseProjectSource` and `compileProject` from
  `@8f4e/compiler`; do not expose a parallel source input contract from this package.
- A sub-program owns one namespace and memory layout and resolves all internal references within that boundary.
- Keep whole-program composition, cross-sub-program linking, relocation, and final WebAssembly assembly outside this package.
- Pass packages used exclusively by this pipeline live under `packages/`.

## Commands

- From the repository root, prefer Nx:
  - `npx nx run @8f4e/sub-program:build`
  - `npx nx run @8f4e/sub-program:typecheck`
  - `npx nx run @8f4e/sub-program:lint`
