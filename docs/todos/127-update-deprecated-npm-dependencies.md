---
title: 'TODO: Update Deprecated npm Dependencies'
priority: Medium
effort: 2-4h
created: 2025-12-17
status: Open
completed: null
---

# TODO: Update Deprecated npm Dependencies

## Problem Description

`npm install` currently emits deprecation warnings for several widely used tooling dependencies:

- `eslint@8.x` is end-of-support
- `rimraf@3.x` is no longer supported
- `glob@7.x` is no longer supported (and pulls `inflight@1.x`, which is deprecated)
- `@humanwhocodes/config-array` and `@humanwhocodes/object-schema` are deprecated in favor of `@eslint/*` packages

This increases maintenance burden, makes future upgrades more painful, and risks unexpected breakage when other tooling moves forward.

## Proposed Solution

Upgrade the toolchain to supported versions and adjust configuration as needed:

- Upgrade `eslint` to a supported major (likely v9) and align configs/plugins
- Upgrade `rimraf` and `glob` to supported majors
- Ensure transitive deprecations (notably `inflight`) are removed by the `glob` upgrade
- Keep Nx targets and lint scripts working consistently across the workspace

## Implementation Plan

### Step 1: Inventory direct vs transitive dependencies

- Identify which workspace package(s) depend on `rimraf`, `glob`, and `eslint`
- Confirm which packages pull `@humanwhocodes/*` and `inflight`
- Record the minimal set of direct bumps needed to eliminate the warnings

### Step 2: Upgrade direct dependencies

- Bump `eslint`, `rimraf`, and `glob` to supported versions
- Update any scripts or APIs that changed between major versions

### Step 3: Migrate ESLint configuration

- Update ESLint configuration to work with the upgraded major version
- Replace deprecated `@humanwhocodes/*` usage with `@eslint/*` equivalents (if applicable)

### Step 4: Update lockfile and validate via Nx

- Regenerate the lockfile
- Run `nx` tasks: lint, typecheck, and tests

## Success Criteria

- [ ] `npm install` produces no deprecation warnings for `eslint`, `rimraf`, `glob`, `inflight`, or `@humanwhocodes/*`
- [ ] `nx run-many -t lint,typecheck,test` passes (or the equivalent workspace validation targets)
- [ ] ESLint runs successfully across all packages

## Affected Components

- Root workspace tooling (`package.json`, lockfile)
- Nx lint targets (as configured in workspace projects)
- ESLint configuration files used by the workspace

## Risks & Considerations

- **ESLint major upgrade**: May require config format changes and plugin alignment
- **Script assumptions**: Some scripts may depend on old `glob` behavior or options
- **Incremental rollout**: If some packages pin older tool versions, coordinate bumps to avoid duplication

## Related Items

- **Related**: `docs/todos/091-optimize-dev-workflow-with-nx-caching.md` (tooling reliability and developer experience)

## References

- https://eslint.org/version-support

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
