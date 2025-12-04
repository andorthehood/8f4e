---
title: 'TODO: Add Tests to Ensure src/examples/projects/* Compile Without Errors'
priority: Medium
effort: 1–2d
created: 2025-12-01
status: Completed
completed: 2025-12-01
---

# TODO: Add Tests to Ensure src/examples/projects/* Compile Without Errors

## Problem Description

The repository contains a set of example projects under `src/examples/projects/*` that are meant to demonstrate end-to-end usage of modules and config blocks. Currently, there is no automated test coverage that verifies these example projects still compile cleanly (both their code modules and config programs) as the compiler and stack-config-compiler evolve.

- What is the current state?
  - Example projects live under `src/examples/projects/*` and are used as reference material and manual testing targets.
  - Compiler and config integration behaviour is covered by unit tests in individual packages, but there is no dedicated test that walks over all example projects and ensures:
    - Their module code compiles without errors.
    - Their config blocks (if present) compile via `compileConfig` without errors.
  - Regressions in language syntax, config semantics, or integration can break examples silently.
- Why is this a problem?
  - Example projects are a key learning and verification tool; if they break, users (and contributors) may not notice until they try a specific example manually.
  - Changes to compiler or config semantics might unintentionally invalidate examples without any CI signal.
  - It is harder to confidently refactor compiler/config behaviour when there is no safety net around the example set.
- What impact does it have?
  - Potentially broken examples shipped in releases.
  - Reduced confidence in config vs module integration, especially as config features grow (e.g. schema validation, new instructions).
  - Manual checking becomes the only way to ensure examples still work.

## Proposed Solution

Add automated tests that iterate over all example projects under `src/examples/projects/*` and verify:

- For each project:
  - All associated module code can be compiled without errors via the existing compiler pipeline (e.g. using the same callbacks as the app shell where appropriate).
  - All associated config blocks (if present) can be compiled with `compileConfig` (from `@8f4e/stack-config-compiler`) without errors.
- The tests should use a similar integration path to what the editor/runtime uses (e.g. `compiler-callback.ts` / `config-callback.ts`) so that they exercise realistic usage.
- Failures should produce readable error messages that reference the project and (where available) line numbers from the compilers.

## Implementation Plan

### Step 1: Discover and load example projects

- Implement a helper in the app shell or a dedicated test file to:
  - Enumerate all entries under `src/examples/projects/*`.
  - Load each project’s definition in a way consistent with how the app/editor expects to load projects.
- Ensure the helper:
  - Is resilient to new projects being added (no hard-coded list if possible).
  - Surfaces project identifiers/names in test output for easier debugging.
- Expected outcome:
  - A programmatic way to iterate over all example projects in tests.
- Dependencies:
  - Existing project registry/loader (if present) in `src/examples` or `src/projects`.

### Step 2: Add tests for module compilation

- For each discovered project:
  - Use the same or similar code path as the app shell (e.g. via `compiler-callback.ts`) to:
    - Compile the project’s module code blocks.
    - Collect compilation results and errors.
  - Assert that:
    - Compilation succeeds (no fatal errors).
    - Any reported errors are either absent or only of allowed kinds (if there are known, explicitly accepted edge cases).
- Expected outcome:
  - Module examples under `src/examples/projects/*` are guaranteed to compile as part of the test suite.
- Dependencies:
  - Step 1 (project discovery and loading).

### Step 3: Add tests for config compilation

- For each discovered project that uses config blocks:
  - Extract the config block(s) into a stack-config program (using the same mechanism described in `docs/todos/108-config-and-module-blocks-integration.md`).
  - Invoke `compileConfig` via `config-callback.ts`:
    - `import { compileConfig as compileStackConfig } from '@8f4e/stack-config-compiler';`
  - Assert that:
    - `result.errors` is empty.
    - `result.config` is not `null`.
- For projects without config blocks, either:
  - Skip config tests, or
  - Confirm that there is nothing to compile and report that explicitly.
- Expected outcome:
  - Any breakage in config syntax/semantics used by examples is caught by the test suite.
- Dependencies:
  - Step 1 (project discovery).
  - Existing config-block extraction and `compileConfig` wiring (see `src/config-callback.ts` and `docs/todos/108-config-and-module-blocks-integration.md`).

### Step 4: Integrate tests into Nx/Vitest workflow

- Add the new tests to the appropriate package/test suite:
  - Likely under the root app or a dedicated integration test area that can see `src/examples/projects`.
- Ensure the tests run via:
  - `npm test` / `nx test` for the affected project.
- Keep runtime reasonable:
  - Tests should be mostly CPU-light (compilation only) and avoid heavy I/O.
- Expected outcome:
  - Example project compilation is part of regular CI and local test runs.
- Dependencies:
  - Steps 2–3 (tests implemented).

## Success Criteria

- [ ] There is a test that discovers all `src/examples/projects/*` entries programmatically.
- [ ] All example projects’ module code is compiled in tests using the standard compiler path, and the tests fail if any project fails to compile.
- [ ] All example projects’ config blocks (where present) are compiled via `compileConfig`, and the tests fail if any config fails to compile.
- [ ] Test output clearly identifies which project (and, where available, which block or line) led to failures.
- [ ] The new tests run as part of the normal Nx/Vitest pipeline (e.g. `npm test`).
- [ ] Adding new example projects automatically adds them to the test coverage, without needing to modify the test list.

## Affected Components

- `src/examples/projects/*`
  - Source of projects to be discovered and compiled in tests.
- `src/compiler-callback.ts`
  - Used (or mirrored) to compile module code in a way consistent with the app shell.
- `src/config-callback.ts`
  - Used to compile config blocks via `@8f4e/stack-config-compiler`.
- `packages/editor` / app-shell test location (TBD)
  - New test file(s) that orchestrate example discovery and compilation checks.
- `vitest.workspace.ts` / relevant `vitest.config.ts`
  - Ensure tests are picked up and run as part of the existing test configuration.

## Risks & Considerations

- **Risk 1: Test brittleness if example loading changes**
  - Changes in how examples/projects are registered or loaded may break discovery logic.
  - Mitigation: Reuse existing registry/loader mechanisms where possible instead of duplicating logic.
- **Risk 2: Test runtime cost**
  - Compiling all examples on every test run could increase CI time.
  - Mitigation: Keep example count and complexity reasonable; consider grouping or selectively running when needed if runtime becomes an issue.
- **Dependencies**:
  - Stable interfaces for project loading, compiler callbacks, and config compilation.
- **Breaking Changes**:
  - None for consumers; failures only indicate broken examples that should be fixed.

## Related Items

- **Related**:
  - `docs/todos/108-config-and-module-blocks-integration.md` — describes how config blocks should be compiled and applied.
  - `docs/todos/110-stack-config-schema-validation.md` — future schema validation may tighten config correctness; these tests will help catch schema-induced regressions in examples.

## References

- `src/examples/projects/*` — example project sources.
- `src/compiler-callback.ts` — app-shell compiler integration.
- `src/config-callback.ts` — app-shell config compilation wrapper.

## Notes

- Initial implementation can focus on “no errors” as the primary assertion; future work could extend tests to assert specific expected shapes or behaviours for each example’s compiled output.

