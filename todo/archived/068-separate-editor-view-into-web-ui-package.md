---
title: 'TODO: Split Editor View Into @8f4e/web-ui Package'
priority: Medium
effort: 3-5d
created: 2025-10-21
status: Open
completed: null
---

# TODO: Split Editor View Into @8f4e/web-ui Package

## Problem Description

Clear description of the issue, technical debt, or improvement needed. Include:
- The editor package still hosts the canvas rendering implementation under `packages/editor/src/view`, tightly coupling engine drawing with state and event orchestration.
- This coupling makes it difficult to reuse the renderer in other environments, complicates dependency management, and blocks splitting bundles for faster builds.
- Without a dedicated UI package, the state layer cannot be consumed independently, slowing refactors toward modular editor architecture and alternative front-ends.

## Proposed Solution

Detailed description of the proposed solution:
- Introduce a new Nx library package `@8f4e/web-ui` that contains the former `view` module, exposing initialization helpers for the canvas renderer.
- Extract shared state-facing types into a neutral package so both the core editor and the UI library compile without circular dependencies; update imports accordingly.
- Update TS config path aliases, package manifests, and Nx project configuration to wire the new package into the build graph while keeping sprite/textures assets accessible.

## Implementation Plan

### Step 1: Scaffold web-ui package
- Create `packages/editor/packages/web-ui` mirroring existing library structure (package.json, project.json, tsconfig, jest config).
- Ensure runtime dependencies on `glugglug` and `@8f4e/sprite-generator` are declared and Nx recognizes the project.
- Dependencies or prerequisites: Nx configuration knowledge, existing package conventions.

### Step 2: Extract shared state contracts
- Move the TypeScript interfaces consumed by the view layer into a new shared package (e.g., `@8f4e/editor-state`) and update imports in both editor core and web-ui.
- Expected outcome: web-ui builds independently without internal relative imports back into editor state files.
- Dependencies or prerequisites: agreement on package naming, update to tsconfig path mappings.

### Step 3: Migrate view code and reconnect editor
- Relocate `packages/editor/src/view` contents into the new package, adapt asset paths, and adjust the editor entrypoint to import `initView` from `@8f4e/web-ui`.
- Expected outcome: editor compile succeeds with the new dependency, and resizing/post-process hooks still function.
- Dependencies or prerequisites: completion of prior steps, updated build scripts.

## Success Criteria

- [ ] `@8f4e/web-ui` builds independently via `npm run build` / Nx target.
- [ ] Editor package compiles and runs using the externalized UI dependency.
- [ ] TypeScript typechecks and automated tests pass for both packages post-migration.

## Affected Components

- `packages/editor/src/view` - Source to be relocated into new package.
- `packages/editor/src/index.ts` - Needs import updates to consume `@8f4e/web-ui`.
- `packages/editor/tsconfig.json` - Requires new path aliases and possibly shared types mapping.

## Risks & Considerations

- **Risk 1**: Circular dependencies between state and UI packages; mitigate by carefully defining shared type exports.
- **Risk 2**: Asset handling for textures or sprite sheets may break if paths are misconfigured; ensure Vite/static copy config aligns with new structure.
- **Dependencies**: Completion of shared state package extraction; existing sprite-generator build artifacts.
- **Breaking Changes**: Potential API adjustments for editor consumers if init contracts change—document any modifications.

## Related Items

- **Depends on**: todo/025-separate-editor-view-layer.md (higher-level architectural goal).
- **Related**: todo/026-separate-editor-user-interactions.md (adjacent modularization work).

## References

- [Nx library setup documentation](https://nx.dev/recipes/adopting-nx/adding-to-monorepo)
- [Vite static asset handling](https://vitejs.dev/guide/assets.html)

## Notes

- Ensure documentation (README/AGENTS) updated to describe new package responsibilities.
- Plan to verify sprite rebuild order before Vite production builds.

## Archive Instructions

When this TODO is completed:
1. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
2. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
