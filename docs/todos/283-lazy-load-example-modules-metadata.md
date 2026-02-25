---
title: 'TODO: Lazy-load Example Modules Metadata'
priority: Medium
effort: 4-8h
created: 2026-02-25
status: Open
completed: null
---

# TODO: Lazy-load Example Modules Metadata

## Problem Description

The app currently imports example module metadata and registry callbacks on startup via:
- `src/editor.ts` -> `src/examples/registry.ts`
- `src/examples/registry.ts` -> `src/examples/exampleModules.ts`

This keeps a large static module metadata table in the initial client bundle even before users open "Add Built-in Module".

## Proposed Solution

Move example module metadata/registry loading behind async boundaries so startup only loads the minimum required code.

Candidate approaches:
- Lazy-import `src/examples/registry.ts` inside callback wrappers in `src/editor.ts`
- Split `moduleMetadata` into a separate lazily imported module
- Optionally load metadata from a JSON asset at runtime

## Anti-Patterns (Optional)

- Do not break existing on-demand loading of individual `.8f4em` module files.
- Do not introduce menu latency without lightweight loading feedback.

## Implementation Plan

### Step 1: Isolate startup-critical callbacks
- Keep startup path minimal and defer module list/dependency callbacks until first use.
- Preserve existing callback API shape expected by editor-state.

### Step 2: Implement lazy-load boundary
- Add cached dynamic import for registry/metadata path.
- Ensure repeated calls reuse the same loaded module.

### Step 3: Validate behavior and bundle impact
- Confirm module menu still works and dependency insertion remains correct.
- Compare startup bundle size before/after.

## Validation Checkpoints (Optional)

- `npx nx run app:build -- --emptyOutDir`
- Verify smaller `dist/assets/index-*.js` main chunk size than baseline
- Manual check: Add Built-in Module menu still lists modules and inserts dependencies correctly
- `npx nx run-many --target=test --all`

## Success Criteria

- [ ] Example module metadata is no longer eagerly loaded at app startup
- [ ] Main startup chunk size is reduced measurably
- [ ] Built-in module insertion and dependency resolution behavior is unchanged
- [ ] No regressions in module/project loading flows

## Affected Components

- `src/editor.ts` - callback wiring and lazy imports
- `src/examples/registry.ts` - possible split/restructure
- `src/examples/exampleModules.ts` - metadata loading boundary
- Menu and code-block creator flows that call module callbacks

## Risks & Considerations

- **UX risk**: first open of module menu may incur async delay; mitigate with tiny loading state.
- **Behavioral risk**: dependency resolution path must stay deterministic.
- **Breaking Changes**: none expected if callback signatures remain unchanged.

## Related Items

- **Related**: [282-investigate-using-8f4e-compiler-for-config.md](./282-investigate-using-8f4e-compiler-for-config.md)
- **Related**: [091-optimize-dev-workflow-with-nx-caching.md](./091-optimize-dev-workflow-with-nx-caching.md)

## References

- [editor.ts](/Users/andorpolgar/git/8f4e/src/editor.ts)
- [registry.ts](/Users/andorpolgar/git/8f4e/src/examples/registry.ts)
- [exampleModules.ts](/Users/andorpolgar/git/8f4e/src/examples/exampleModules.ts)

## Notes

- Baseline from current production build (2026-02-25): `dist/assets/index-02PHIF-S.js` is ~213.94 kB raw (57.74 kB gzip).

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
