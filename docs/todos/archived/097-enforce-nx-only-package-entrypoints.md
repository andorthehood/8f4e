---
title: 'TODO: Enforce Nx-Only Package Entrypoints'
priority: Medium
effort: 0.5-1d
created: 2025-11-21
status: Completed
completed: 2025-11-21
---

# TODO: Enforce Nx-Only Package Entrypoints

## Problem Description

Per-package `package.json` scripts (`dev`, `build`, `test`, `lint`, `typecheck`, plus a few bundle/screenshot helpers) duplicate Nx targets. The duplication drifts, hides the canonical path (`nx run <project>:<target>`), and makes maintenance harder when commands change (e.g., Vitest flags, Vite configs, watch behavior).

## Proposed Solution

- Make Nx targets the sole entrypoints for every workflow (package and root), including bundle and screenshot flows.
- Remove all package-level scripts and replace root scripts with direct Nx usage (or drop them entirely), so contributors call `nx run <project>:<target>` or `nx run-many` directly.
- Add or align Nx targets wherever a package currently only has an npm script equivalent.
- Sweep docs (README/dev guides/todos) to remove references to package/root npm scripts and replace with Nx commands.

## Implementation Plan

### Step 1: Inventory and map scripts to Nx targets
- Enumerate every package’s current scripts vs. `project.json` targets (build/dev/test/typecheck/bundle/screenshot/watch).
- Identify gaps (e.g., packages with `dev` scripts but no `dev` target) and confirm expected command bodies (tsc watch, vite build configs, playwright invocations).
- Outcome: A checklist of missing or misaligned Nx targets to add/adjust.

### Step 2: Add/align Nx targets to cover all commands
- Add Nx targets for any missing equivalents (e.g., `dev` watch targets, `bundle`, `test:screenshot` variants) using consistent executor/configuration.
- Normalize target names so screenshot/bundle commands are reachable via `nx run <project>:<target>` with no npm-script fallback.
- Outcome: All needed commands exist as Nx targets with up-to-date command bodies.

### Step 3: Remove package.json scripts and root proxies
- Delete all package-level scripts (no exceptions) once Nx parity is confirmed.
- Remove root npm scripts entirely, or reduce to a minimal set that directly shells to `nx` without duplicating command bodies; prefer documenting raw Nx usage.
- Update docs/README/dev guides/todo entries to show `nx run <project>:<target>` usage for dev/build/test/typecheck/bundle/screenshot (and `nx run-many`/`nx affected` where helpful); replace any lingering npm-script references.
- Outcome: Package `scripts` sections are empty/absent; root `package.json` has no redundant workflows; documentation reflects Nx-only usage with no npm-script references.

### Step 4: Verify Nx-only flow
- Run `npm run lint`, `npm run typecheck`, and `npm run test` (Nx-backed) to confirm pipeline works.
- Spot-check representative Nx targets (`nx run <project>:dev`, bundles, screenshot tests) to ensure watch/build flows are intact.
- Outcome: Nx targets fully replace npm scripts with working dev/build/test flows.

## Success Criteria

- [ ] Every package action (dev/build/test/typecheck/bundle/screenshot) is exposed as an Nx target with correct commands.
- [ ] All `packages/**/package.json` files have no redundant scripts.
- [ ] Root `package.json` has either no workflow scripts or only thin `nx` pass-throughs with no duplicated command bodies.
- [ ] Docs/examples/todos reference only Nx commands (or root Nx-proxy scripts), with no npm-script remnants.
- [ ] Nx-backed lint/typecheck/test flows pass after the change.

## Affected Components

- `packages/**/package.json` - Remove scripts.
- `packages/**/project.json` - Add/align targets (dev/build/test/typecheck/bundle/screenshot).
- `README.md`, `docs/todos/_index.md`, any dev workflow docs - Clarify Nx-only usage.

## Risks & Considerations

- **Dev convenience regression**: Contributors used to `npm run dev` inside packages need clear Nx equivalents; mitigate with concise docs/root aliases.
- **Watch coverage gaps**: Ensure new `dev` targets mirror previous watch behavior (tsc/vite) to avoid slower feedback loops.
- **Bundle/screenshot parity**: Validate that bundle and Playwright targets carry over required flags/configs when moved to Nx-only.
- **Dependencies**: None externally, but coordinate with ongoing Nx caching work to avoid conflicting config changes.

## Related Items

- **Related**: TODO-091 (Optimize dev workflow with Nx caching and incremental builds) for broader tooling alignment.
- **Depends on**: None.
- **Blocks**: Prevents future reintroduction of package-level scripts once Nx is canonical.

## References

- Nx workspace targets in `project.json` files.
- Existing root npm scripts that proxy Nx (`package.json`).

## Notes

- No package-level exceptions: all package scripts are removed once Nx parity is in place.
- Keep root-level npm scripts only as thin Nx proxies if helpful for common workflows.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section.
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context).
