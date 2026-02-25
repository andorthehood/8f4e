---
title: 'TODO: Lazy-load Optional Runtimes'
priority: Medium
effort: 4-8h
created: 2026-02-25
status: Open
completed: null
---

# TODO: Lazy-load Optional Runtimes

## Problem Description

Runtime definitions are currently assembled eagerly in the startup path, including optional runtimes that are often unused in a session.
In practice, most sessions use a single runtime, so eagerly loading all runtime wiring adds avoidable startup bundle weight.

Constraint:
- Compiler worker should remain eager at startup (no lazy-load change for compiler worker).

## Proposed Solution

Keep default runtime initialization fast while lazy-loading non-default runtime definitions and assets on demand.

High-level approach:
- Keep default runtime available immediately.
- Load other runtime definitions only when selected/required.
- Preserve existing runtime registry API expected by editor-state.

## Anti-Patterns (Optional)

- Do not delay default runtime startup.
- Do not change runtime behavior/config semantics while introducing lazy boundaries.
- Do not couple runtime loading changes with compiler worker loading changes.

## Implementation Plan

### Step 1: Split default vs optional runtime wiring
- Keep default runtime path eager.
- Move optional runtime factories/imports behind cached dynamic imports.

### Step 2: Add on-demand runtime registration/loading
- Resolve runtime definition at selection time if not yet loaded.
- Ensure loading is idempotent and race-safe.

### Step 3: Validate UX and bundle impact
- Confirm runtime switching still works across all runtime types.
- Measure startup chunk reduction and ensure no regressions.

## Validation Checkpoints (Optional)

- `npx nx run app:build -- --emptyOutDir`
- Compare startup `dist/assets/index-*.js` size before/after
- Manual runtime switch test across all runtime options
- `npx nx run-many --target=test --all`

## Success Criteria

- [ ] Optional runtimes are not eagerly loaded in startup bundle
- [ ] Default runtime behavior remains unchanged
- [ ] Runtime switching remains functional and stable
- [ ] Startup bundle size is measurably reduced

## Affected Components

- `src/runtime-registry.ts` - runtime registration and import boundaries
- Runtime packages under `packages/runtime-*` - runtime definition loading path
- Runtime selection/switch flows in editor-state and app wiring

## Risks & Considerations

- **First-switch latency**: first selection of optional runtime may incur async load; mitigate with minimal loading feedback.
- **Race conditions**: rapid runtime switching can overlap async loads; mitigate with cached promise and guard logic.
- **Breaking Changes**: none expected if registry contract remains intact.

## Related Items

- **Related**: [205-move-runtime-definitions-into-runtime-packages.md](./205-move-runtime-definitions-into-runtime-packages.md)
- **Related**: [016-runtime-loading-ui.md](./016-runtime-loading-ui.md)
- **Related**: [283-lazy-load-example-modules-metadata.md](./283-lazy-load-example-modules-metadata.md)

## References

- [runtime-registry.ts](/Users/andorpolgar/git/8f4e/src/runtime-registry.ts)
- [editor.ts](/Users/andorpolgar/git/8f4e/src/editor.ts)
- [runtime-audio-worklet](/Users/andorpolgar/git/8f4e/packages/runtime-audio-worklet)
- [runtime-web-worker-midi](/Users/andorpolgar/git/8f4e/packages/runtime-web-worker-midi)

## Notes

- Scope explicitly excludes lazy-loading the compiler worker.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
