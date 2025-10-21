---
title: 'TODO: Add compiler option to include AST in output (default false)'
priority: Medium
effort: 3–5 hours
created: 2025-09-04
status: Open
completed: null
---

# TODO: Add compiler option to include AST in output (default false)

The compiler currently includes the parsed AST on each `CompiledModule` in its output. A repo-wide search confirms the AST is not consumed outside the compiler package. Always returning AST increases payload size, serialization cost (when posting from the worker), and coupling of internal structures to the public API.

We should make AST emission opt-in so production builds are leaner while keeping the option available for debugging and testing.

## Proposed Solution

- Add a new `includeAST?: boolean` flag to `CompileOptions` (default `false`).
- When `includeAST` is `false`, omit the `ast` property from `CompiledModule` in the public result. When `true`, include it exactly as today.
- Keep tests that snapshot AST by enabling `includeAST: true` locally.
- Optionally, mark `CompiledModule['ast']` as optional in types, or use a conditional emission utility that strips the property at the composition step to avoid ripple changes.

## Implementation Plan

### Step 1: Extend types and defaults
- Update `packages/compiler/src/types.ts` to add `includeAST?: boolean` on `CompileOptions` (default behavior remains false at call sites).
- Consider making `CompiledModule['ast']` optional and update internal references accordingly.

### Step 2: Thread option through compile pipeline
- In `packages/compiler/src/index.ts`, propagate `includeAST` into `compileModules` and at the point where `compiledModulesMap` is constructed, omit `ast` unless `includeAST` is true.
- Alternatively strip `ast` at the return boundary of `compile()` for all modules when `includeAST` is false.

### Step 3: Adjust internal constructors
- In `packages/compiler/src/compiler.ts` (module compiler), keep building with `ast` internally for existing logic, but ensure public result respects the flag.

### Step 4: Update tests
- Update snapshots or test harnesses that expect `ast` to pass `{ includeAST: true }`.
- Add a small test asserting that when `includeAST` is false, the result has no `ast` properties.

## Success Criteria

- [ ] `CompileOptions` includes `includeAST?: boolean` with default false.
- [ ] `compile()` omits `ast` from public results unless `includeAST` is true.
- [ ] All affected tests pass; AST-snapshot tests explicitly opt-in.
- [ ] No consumer packages break (editor/runtime workers unaffected).

## Affected Components

- `packages/compiler/src/types.ts` – Add `includeAST?: boolean`; potentially make `CompiledModule['ast']` optional.
- `packages/compiler/src/index.ts` – Strip or include `ast` based on option; thread flag through pipeline.
- `packages/compiler/src/compiler.ts` – Ensure compatibility if types change.
- `packages/compiler/tests/**` – Update tests to opt-in where needed and add negative test.
- `packages/compiler-worker/src/testBuild.ts` – Verify no assumptions about `ast`; adjust typings if necessary.

## Risks & Considerations

- **Typing ripple**: Making `ast` optional may affect several internal references. Mitigate by stripping `ast` only at the boundary (`compile()` return), keeping internal types unchanged.
- **Test churn**: Snapshot tests that include `ast` need an explicit opt-in; update fixtures accordingly.
- **API stability**: This is a backwards-compatible change if `ast` was undocumented; communicate in changelog if consumers relied on it implicitly.

## Related Items

- Related discussion: making compiler outputs leaner and minimizing worker postMessage payloads.

## References

- Internal search confirmed AST is unused outside compiler package.

## Notes

- Default remains `false` to avoid AST in production builds.
- Consider follow-up to hide other internal-only fields if any emerge.

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.

