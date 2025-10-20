# TODO: Align dev watcher paths across packages

**Priority**: 🟡
**Estimated Effort**: 1-2 days
**Created**: 2025-10-20
**Status**: Open
**Completed**: 

## Problem Description

The dev server currently consumes some internal packages (e.g., `@8f4e/editor`, `@8f4e/state-manager`) via their compiled `dist` outputs. When the Nx watch process for a package isn’t running—or fails—changes in that package don’t propagate through Vite’s HMR pipeline. This leads to inconsistent developer experience and forces manual rebuilds.

## Proposed Solution

Point all packages Vite uses during development to their `src` directories while keeping production builds on `dist`. This ensures immediate reloads from source edits without relying on Nx/tsc to regenerate build artifacts. Alternatives considered include adding individual `tsc --watch` processes per package or using Nx daemon-driven watchers, but these increase complexity and surface the same stability issues we already see.

## Implementation Plan

### Step 1: Audit aliases
- Review `vite.config.mjs` and other tooling configs for package aliases that resolve to `dist`.
- Document which packages require adjustments to their dev-time paths.

### Step 2: Update dev aliases
- Adjust aliases so dev mode resolves to `src` for each package while preserving `dist` for production builds.
- Verify there are no bundler-specific constraints (e.g., non-TS assets) blocking `src` usage.

### Step 3: Validate workflows
- Run `npm run dev` and confirm HMR fires for all adjusted packages.
- Execute `npm run build` to ensure production builds still rely on compiled outputs and succeed.

## Success Criteria

- [ ] Dev server reloads immediately when editing any aliased package source.
- [ ] `npm run dev` requires no additional watcher processes beyond Vite.
- [ ] Production build (`npm run build`) completes without alias regressions.

## Affected Components

- `vite.config.mjs` - Update alias resolution logic.
- `packages/*/package.json` - Confirm build/watch scripts align with the new approach.
- Potential shared tooling scripts referencing `dist` during dev.

## Risks & Considerations

- **tSC Behavior**: Ensuring TypeScript path mapping, declaration emission, or artifact expectations are still met during builds.
- **Alias Divergence**: Avoid dev/prod mismatches where source code structure differs from emitted dist layout.
- **Dependencies**: May need follow-up tasks if other tooling (tests, Storybook, etc.) expect `dist`.

## Related Items

- **Depends on**: None
- **Related**: TODO #066 (color scheme persistence); similar scope re: dev tooling improvements.

## References

- [Vite resolve.alias docs](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [Nx docs on watching packages](https://nx.dev)

## Notes

- After implementation, consider removing redundant `tsc --watch` scripts from dev workflow.
- Keep an eye on Nx daemon stability; if issues persist we might explore `nx reset` automation.
