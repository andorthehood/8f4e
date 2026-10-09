# Test Runner Package Guidelines

- This package owns assertion declarations, execution, structured results, and failure formatting shared by compiler
  fixtures and the CLI. Keep their adapters focused on caller-specific file handling, compilation options, and snapshots.
- Keep the runner independent of the compiler implementation. Accept a compile callback so compiler tests can use it
  without introducing a circular workspace dependency. The package must also remain usable without Node file APIs.
- Assertion instrumentation lives in the nested workspace package `@8f4e/test-precompiler` at
  `packages/test-runner/packages/test-precompiler/`. Use it on original project source before injecting assertion declarations.
- Preserve source mappings for modules, functions, and nested groups. Distinguish static site IDs from runtime invocation
  indices; loops may invoke one site more than once.
- Return assertion failures as data for callers, including future editor status indicators.
- Validate with `npx nx run @8f4e/test-runner:build|test|typecheck|lint` from the repository root.
- Keep real compiler/Wasm integration tests in `packages/compiler/tests/testRunner.test.ts` and terminal reporting tests
  in `packages/cli/tests/cli.test.ts`.
