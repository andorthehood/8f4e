# Postmortem: sprite-generator CI Build Failures (TypeScript Module Resolution)

**Date:** November 1, 2025  
**Status:** Resolved  
**Severity:** High (blocked CI/CD pipeline)

## Summary

The `sprite-generator` package was failing to build in CI with TypeScript errors indicating it couldn't find the `glugglug` module, despite the dependency being correctly declared and the build working locally.

## Timeline

- **Initial Report:** Build failures in GitHub Actions when building sprite-generator
- **Error:** `TS2307: Cannot find module 'glugglug' or its corresponding type declarations`
- **Investigation:** Suspected git submodule issues, workspace configuration problems
- **Root Cause Identified:** Missing `^build` dependency in sprite-generator's Nx configuration
- **Fix Applied:** Added `^build` to `dependsOn` arrays in sprite-generator's project.json
- **Resolution:** CI builds now succeed consistently

## Root Cause

The sprite-generator package's `project.json` had custom `dependsOn` configurations that **overrode** the global Nx `targetDefaults` instead of merging with them:

```json
// packages/editor/packages/sprite-generator/project.json (BEFORE)
"build": {
  "dependsOn": ["generate-fonts"],  // Missing "^build"!
  ...
}
```

The global `nx.json` specifies that all `build` targets should depend on `["^build"]`, meaning "build all my dependencies first." However, when a project defines its own `dependsOn`, it **replaces** rather than merges with the global defaults.

This meant that when Nx orchestrated parallel builds in CI, it didn't know that `sprite-generator` needed to wait for `glugglug` to be built first.

## Why It Failed in CI But Not Locally

### Race Condition in Parallel Builds

The issue was a **race condition** that manifested differently in CI vs local environments:

#### CI Environment (Clean State):
1. Fresh checkout with no `dist/` directories
2. `npm ci` installs dependencies and creates workspace symlinks
3. `npx nx run-many --target=build --all` parallelizes builds across all packages
4. Without `^build` dependency, Nx schedules `sprite-generator:build` and `glugglug:build` in parallel
5. `sprite-generator:build` starts immediately (only waits for `generate-fonts`)
6. TypeScript tries to resolve `import { SpriteCoordinates } from 'glugglug'`
7. Looks in `node_modules/glugglug/dist/index.d.ts` (via symlink)
8. **File doesn't exist yet** because `glugglug:build` is still running → ❌ **FAIL**

#### Local Development (Stateful):
1. Previous builds have already created `glugglug/dist/`
2. Nx cache may restore `glugglug` build artifacts
3. Manual builds (`npm run build`) often happen sequentially
4. When running `npm run dev`, dependencies are built first due to dev target's `^build` dependency
5. `glugglug/dist/index.d.ts` already exists → ✅ **SUCCESS**

### Why TypeScript Needs the dist/ Directory

TypeScript's module resolution for the `glugglug` import:
```typescript
import { SpriteCoordinates } from 'glugglug';
```

Resolution path:
1. Looks up the dependency tree for `node_modules/glugglug/`
2. Reads `glugglug/package.json` which has `"types": "./dist/index.d.ts"`
3. Resolves to symlink: `node_modules/glugglug/dist/index.d.ts` → `packages/editor/packages/glugglug/dist/index.d.ts`
4. **Must exist at build time** or TypeScript fails

## The Fix

Added `"^build"` to the `dependsOn` array for all targets that run TypeScript:

```json
// packages/editor/packages/sprite-generator/project.json (AFTER)
"build": {
  "dependsOn": ["^build", "generate-fonts"],  // ✅ Now includes "^build"
  ...
},
"dev": {
  "dependsOn": ["^build", "generate-fonts"],  // ✅ Now includes "^build"
  ...
},
"typecheck": {
  "dependsOn": ["^build", "generate-fonts"],  // ✅ Now includes "^build"
  ...
}
```

This ensures:
1. Nx builds `glugglug` first (because sprite-generator depends on it)
2. Then generates fonts for sprite-generator
3. Finally builds sprite-generator with glugglug's types available

## Verification

After the fix, running `npx nx run @8f4e/sprite-generator:build` shows:
```
Running target build for project @8f4e/sprite-generator and 2 tasks it depends on:
> nx run glugglug:build
> nx run @8f4e/sprite-generator:generate-fonts
> nx run @8f4e/sprite-generator:build
✓ Successfully ran target build
```

## Lessons Learned

### 1. **Nx `dependsOn` Overrides, Not Merges**
When a project.json specifies `dependsOn`, it completely replaces the global `targetDefaults`, rather than merging. Always include `^build` explicitly when overriding.

**Action:** Review all project.json files for targets that need upstream dependencies

### 2. **Race Conditions Hide in Local State**
Local development environments accumulate state (cached builds, dist/ directories) that masks race conditions in parallel builds.

**Action:** Periodically test with `rm -rf packages/**/dist` to simulate CI conditions

### 3. **TypeScript Module Resolution Requires Built Artifacts**
TypeScript can't resolve types from source files in workspace dependencies - it needs the `dist/` output with declaration files.

**Action:** Ensure all TypeScript packages build declarations (`"declaration": true`) and set proper `types` field in package.json

### 4. **CI Reveals True Parallelization Issues**
CI's clean slate and parallel execution exposes dependency ordering issues that may work locally by accident.

**Action:** When adding new inter-package dependencies, always verify `^build` is in `dependsOn`

### 5. **Git Submodules Were a Red Herring**
Initial investigation focused on submodule checkout, but that wasn't the issue. The submodule was checked out fine via the `preinstall` hook.

**Action:** Use systematic debugging: verify each assumption (submodule present? symlink exists? dist/ built?)

## Related Configuration

Key files involved:
- `nx.json` - Global targetDefaults with `"build": { "dependsOn": ["^build"] }`
- `packages/editor/packages/sprite-generator/project.json` - Was missing `^build`
- `packages/editor/packages/sprite-generator/package.json` - Declares `glugglug` dependency
- `packages/editor/packages/glugglug/package.json` - Exports types via `"types": "./dist/index.d.ts"`

## Prevention

To prevent similar issues:

1. **Template for new packages:** When creating new project.json files, always include `^build` in `dependsOn`:
   ```json
   "build": {
     "dependsOn": ["^build", "other-local-task"],
     ...
   }
   ```

2. **CI testing:** Always test in CI before merging changes that add inter-package dependencies

3. **Documentation:** Add a note to AGENTS.md files about the importance of `^build` in Nx configurations

4. **Verification script:** Consider adding a lint rule or script that validates all `build`, `dev`, and `typecheck` targets include `^build` when the package has workspace dependencies

## References

- [Nx Task Pipeline Configuration](https://nx.dev/concepts/task-pipeline-configuration)
- [Nx dependsOn Documentation](https://nx.dev/reference/project-configuration#dependson)
- TypeScript Module Resolution: [Bundler mode](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution)

