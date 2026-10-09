# Test Runner Package Guidelines

- This package owns native assertion callbacks, execution, structured results, and failure formatting shared by
  compiler fixtures and the CLI. Adapters own file handling, compilation options, and snapshots.
- Accept compiled output using language-spec contracts; adapters own compilation. Keep the runner independent of
  the compiler implementation, browser-safe, and free of Node file APIs.
- Consume compiler-produced assertion sites. Do not rewrite source or inject assertion declarations.
- Implement nonzero integer conditions and exact equality; approximate expectations belong in project source.
- Distinguish static site IDs from runtime invocation indices and preserve included-source provenance.
- Initialize fresh non-shared memories once before executing the test entry, including custom memory regions.
  When callers supply memories, borrow them without initialization or reset; the caller owns their lifetime.
- Return executed assertion results and failures as serializable data. Unexecuted static sites remain in the
  compiler's assertion-site lookup.
- Validate with `npx nx run @8f4e/test-runner:build|test|typecheck|lint` from the repository root.
- Keep real compiler/Wasm integration coverage in `packages/compiler/tests/testRunner.test.ts`, terminal reporting
  tests in `packages/cli/tests/cli.test.ts`.
