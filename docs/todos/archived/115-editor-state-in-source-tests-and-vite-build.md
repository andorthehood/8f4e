---
title: 'TODO: Align Editor-State Builds with In-Source Tests and Vite Tree-Shaking'
priority: Medium
effort: 1–2d
created: 2025-12-02
status: Completed
completed: 2026-01-14
---

# TODO: Align Editor-State Builds with In-Source Tests and Vite Tree-Shaking

## Problem Description

The `@8f4e/editor-state` package now uses in-source Vitest blocks (`if (import.meta.vitest) { ... }`) for helper and serialization tests, and its build has been partially updated to use Vite for better dead-code elimination. However:
- Other core packages still rely solely on `tsc` builds and do not consistently define `import.meta.vitest` for production, which means in-source tests would either not run or not be safely tree-shaken if adopted.
- The editor-state build currently uses a hybrid approach (`tsc --emitDeclarationOnly && vite build`) that works but is not yet documented or consistently applied across the workspace.
- There is a risk of future regressions where new packages add in-source tests without the corresponding `includeSource` / `define` wiring in Vitest/Vite configs, leading to tests leaking into bundles or not running at all.

This TODO tracks aligning the build and test configuration patterns for editor-state and other relevant packages so that in-source Vitest blocks are:
- Properly discovered and executed by Vitest, and
- Reliably eliminated from production bundles via Vite.

## Proposed Solution

1. Treat `@8f4e/editor-state` as the reference implementation for:
   - In-source Vitest tests using `import.meta.vitest`.
   - A Vite-based library build that defines `import.meta.vitest` for tree-shaking.
   - A `tsc --emitDeclarationOnly` step to emit `.d.ts` alongside the Vite JS bundle.
2. Document this pattern and apply it selectively to other packages that:
   - Export reusable TS libraries (with `types`/`exports` pointing at `dist/*.d.ts`), and
   - Would benefit from in-source tests (e.g. compiler, runtime-* packages) without polluting bundles.
3. Centralize the common Vitest/Vite/TypeScript configuration in `@8f4e/config` where possible, so that:
   - Packages opt into a small set of well-documented presets instead of duplicating config.
   - Changes to how `import.meta.vitest` is handled (types, `define`, `includeSource`) can be made in one place.
4. Ensure both Vitest and Vite configs consistently:
   - Use `test.includeSource` to discover in-source tests in `src/**/*.ts`.
   - Define `import.meta.vitest` as `'undefined'` for production builds.

## Implementation Plan

### Step 1: Document the editor-state pattern

- Add a short section to `packages/editor/packages/editor-state/TESTING.md` describing:
  - The use of in-source tests via `import.meta.vitest`.
  - The `vite.config.ts` settings (`define['import.meta.vitest']`) for tree-shaking.
  - The `tsc --emitDeclarationOnly && vite build` pipeline and why both steps are needed (JS vs `.d.ts`).
- Expected outcome:
  - Clear reference documentation that future contributors can follow when adding similar patterns elsewhere.
- Dependencies:
  - Current editor-state build and test setup.

### Step 2: Identify target packages for the same pattern

- Review core packages that:
  - Export libraries consumed by other parts of the workspace (`@8f4e/compiler`, runtimes, etc.).
  - Already use Vitest or could benefit from in-source tests.
- For each candidate package, decide whether:
  - It should adopt in-source `import.meta.vitest` tests, and
  - It should switch from pure `tsc` builds to the hybrid `tsc --emitDeclarationOnly && vite build` approach.
- Expected outcome:
  - A small list of packages (or a rule of thumb) for where this pattern applies.
- Dependencies:
  - Package inventory in `nx.json` / `project.json` files.

### Step 3: Standardize and centralize Vitest config for in-source tests

- For editor-state and selected packages:
  - Ensure `vitest.config.ts` includes:
    - `test.includeSource` covering `src/**/*.ts`.
    - A `define` block that sets `'import.meta.vitest': 'undefined'`.
  - Ensure their test `tsconfig` files (`tsconfig.test.json`) include `types: ["vitest/importMeta"]`.
  - Where possible, move shared Vitest configuration into `@8f4e/config/vitest` so packages consume a preset rather than duplicating options.
- Expected outcome:
  - In-source tests run consistently in Vitest across the selected packages without type errors.
- Dependencies:
  - Step 2 package selection.

### Step 4: Standardize and centralize Vite library builds for tree-shaking

- For editor-state and selected packages:
  - Use `@8f4e/config/vite` helpers (`createLibConfig` / `createEsLibConfig`) to:
    - Build libraries to `dist` in ES format.
    - Set `emptyOutDir: false` where `tsc` emits `.d.ts` into the same folder.
  - Add `define: { 'import.meta.vitest': 'undefined' }` to each package-level `vite.config.ts`.
  - Update `project.json` builds to run `tsc --emitDeclarationOnly && vite build`.
- Expected outcome:
  - All selected packages can safely use in-source tests without leaking them into their distributed JS.
- Dependencies:
  - Step 2 package selection.

### Step 5: Update docs/todo index and cross-references

- Add this TODO to `docs/todos/_index.md` under Active TODOs with ID `112`.
- Cross-link from relevant existing TODOs:
  - `docs/todos/091-optimize-dev-workflow-with-nx-caching.md` (build/test pipeline).
  - `docs/todos/038-editor-types-testing.md` (type and test coverage).
- Expected outcome:
  - This work is discoverable and connected to broader testing and tooling initiatives.
- Dependencies:
  - This TODO document.

## Success Criteria

- [ ] `@8f4e/editor-state` build and tests are documented as the canonical pattern for in-source tests + Vite tree-shaking.
- [ ] At least the most critical shared libraries (e.g. compiler/runtime packages) either:
  - Use the same hybrid `tsc --emitDeclarationOnly && vite build` pattern, or
  - Explicitly document why they do not.
- [ ] Vitest configs for selected packages:
  - Include `includeSource` for `src/**/*.ts`.
  - Define `import.meta.vitest` and type it via `tsconfig.test.json`.
- [ ] Vite configs for selected packages:
  - Define `import.meta.vitest` so in-source tests do not appear in production bundles.
- [ ] TypeScript consumers of these packages do not see `TS7016` errors (declarations are emitted and wired correctly).
 - [ ] Shared configuration for these concerns (Vitest, Vite, TS lib options) is owned by `@8f4e/config` rather than duplicated ad hoc in each package.

## Affected Components

- `packages/editor/packages/editor-state/*`
  - Reference implementation for in-source tests and Vite library build.
- `packages/compiler/*`, `packages/runtime-*/**`
  - Candidate packages for adopting the same pattern.
- `packages/config/src/vitest/index.ts`, `packages/config/src/vite/index.ts`
  - Central place to expose presets/helpers for Vitest and Vite that encode this pattern (includeSource, define, build options).
- `docs/todos/_index.md`, `packages/editor/packages/editor-state/TESTING.md`
  - Documentation updates for discoverability and maintenance.

## Risks & Considerations

- **Risk 1**: Over-applying the pattern to packages that do not need Vite builds may add unnecessary complexity.
  - Mitigation: Limit adoption to packages that export browser-facing bundles or where in-source tests provide clear value.
- **Risk 2**: Misconfigured `tsc` / Vite build ordering could wipe out `.d.ts` files or reintroduce `TS7016` errors.
  - Mitigation: Standardize on `tsc --emitDeclarationOnly && vite build` and ensure Vite builds do not `emptyOutDir` when sharing `dist`.
- **Risk 3**: CI times could increase slightly due to extra Vite builds.
  - Mitigation: Use Nx caching and only enable Vite builds for packages where tree-shaking is important.

## Related Items

- **Depends on**:
  - `docs/todos/091-optimize-dev-workflow-with-nx-caching.md` (build/test workflow and caching).
- **Related**:
  - `docs/todos/038-editor-types-testing.md` (type safety & test coverage improvements).
  - `docs/todos/033-editor-state-effects-testing.md` (testing strategy around editor-state).
  - `docs/todos/111-tests-for-examples-projects-compilation.md` (integration tests against examples).

## References

- Vitest in-source tests with `import.meta.vitest` (official docs).
- Vite library build configuration and `define`-based dead-code elimination.

## Notes

- This TODO is intentionally scoped to build/test configuration and does not require adding new test cases; it focuses on making existing and future in-source tests safe and consistent across packages.
