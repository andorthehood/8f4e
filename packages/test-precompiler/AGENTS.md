# Test Precompiler Package Guidelines

- This package owns test-only assertion source instrumentation, independent of the editor and runtime implementations.
- Use `precompileTestProject` on an uninstrumented compiler-input project. Preserve the original project and physical
  source line positions in the returned project.
- Site IDs identify static assertion calls within one precompilation result, including nested project groups.
- Use `@8f4e/tokenizer` to identify assertion calls; do not match calls in notes or comments.
- Assertion declarations, host imports, execution, and reporting belong to callers of this package.
- Validate with `npx nx run @8f4e/test-precompiler:build|test|typecheck|lint` from the repository root.
- Keep meaningful coverage for continued arguments, original source locations, and compilation into executable Wasm.
