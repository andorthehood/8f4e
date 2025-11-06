# Postmortem: Netlify Build Failure - TypeScript Module Resolution (editor-state)

**Date:** November 5, 2025  
**Status:** Resolved  
**Severity:** High (blocked Netlify deployments)

## Summary

The Netlify build failed with a TypeScript error indicating it couldn't find the `@8f4e/editor-state` module when type-checking example files. The error occurred only in CI (Netlify), not in local development. The root cause was identical to the issue documented in the [2025-11-01 sprite-generator postmortem](./2025-11-01-sprite-generator-ci-build-failure.md): missing `^build` dependency in the `typecheck` target's `dependsOn` configuration.

## Timeline

- **Initial Report:** Netlify build failed with error:
  ```
  src/examples/modules/amenBreak64Step.ts(1,36): error TS2307: Cannot find module 
  '@8f4e/editor-state' or its corresponding type declarations
  ```
- **Investigation:** Reviewed previous postmortem for similar patterns
- **Root Cause Identified:** `app` project's `typecheck` target was missing `^build` in `dependsOn`
- **Fix Applied:** Added `"dependsOn": ["^build"]` to `typecheck` target in root `project.json`
- **Resolution:** Build now succeeds on Netlify

## Root Cause

The root `project.json` had a `typecheck` target that didn't declare dependency on upstream builds:

```json
// project.json (BEFORE)
"typecheck": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc --noEmit",
    "cwd": "{workspaceRoot}"
  }
  // Missing "dependsOn": ["^build"]!
}
```

When the `app:build` target ran on Netlify:
1. `app:build` has `"dependsOn": ["typecheck", "^build"]`
2. Nx schedules both `app:typecheck` and package builds in parallel
3. TypeScript starts checking `src/examples/modules/amenBreak64Step.ts`
4. Tries to resolve `import type { ExampleModule } from '@8f4e/editor-state'`
5. Looks for `node_modules/@8f4e/editor-state/dist/index.d.ts` (via npm workspace symlink)
6. **File doesn't exist yet** because `@8f4e/editor-state:build` is still running → ❌ **FAIL**

## Why It Failed in CI But Not Locally

This was a **race condition** identical to the sprite-generator issue:

### CI Environment (Clean State):
- Fresh checkout with no `dist/` directories
- `npm ci` creates workspace symlinks
- Nx parallelizes builds across all packages
- Without `^build`, `app:typecheck` runs immediately in parallel with package builds
- TypeScript looks for `@8f4e/editor-state/dist/index.d.ts` before it's built
- **Missing file** → TypeScript error

### Local Development (Stateful):
- Previous builds have created `packages/*/dist/` directories
- Nx cache may restore build artifacts
- `npm run dev` has its own `^build` dependency that builds packages first
- Manual sequential builds hide the race condition
- `dist/index.d.ts` already exists → ✅ **SUCCESS**

## The Fix

Added `"^build"` to the `typecheck` target's `dependsOn` array:

```json
// project.json (AFTER)
"typecheck": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc --noEmit",
    "cwd": "{workspaceRoot}"
  },
  "dependsOn": ["^build"]  // ✅ Now includes "^build"
}
```

This ensures:
1. Nx builds all upstream dependencies first (`@8f4e/editor-state`, `@8f4e/compiler`, etc.)
2. All `dist/` directories with `.d.ts` files are created
3. Then runs `app:typecheck` with all types available
4. TypeScript successfully resolves all workspace package imports

## How the Previous Postmortem Helped

The [2025-11-01 sprite-generator postmortem](./2025-11-01-sprite-generator-ci-build-failure.md) was **instrumental** in quickly diagnosing this issue:

### Pattern Recognition:
- Same error pattern: `TS2307: Cannot find module`
- Same environment difference: works locally, fails in CI
- Same root cause: missing `^build` in `dependsOn`

### Quick Resolution Path:
1. **Recognized the pattern** from the error message
2. **Checked the postmortem** for similar configuration issues
3. **Applied the documented fix** immediately
4. **Resolution time:** ~5 minutes (vs. hours of investigation)

### Documentation Value:
The postmortem's detailed explanation of:
- Why Nx `dependsOn` overrides instead of merges
- How TypeScript module resolution works with workspace packages
- The race condition mechanics in parallel builds
- Verification steps to confirm the fix

All of this made the fix obvious and confident, without needing to re-investigate the problem from scratch.

## Lessons Learned

### Validation of Postmortem Process:
- **Postmortems are valuable documentation** - they paid off within 4 days
- **Pattern documentation saves time** - similar issues resolve faster
- **Root cause analysis matters** - understanding the "why" enables quick pattern matching

### Nx Configuration Patterns:
1. **Any target that runs TypeScript needs `^build`** if it imports workspace packages
2. **Always include `^build` when overriding `dependsOn`** - it doesn't merge with global defaults
3. **Test in CI before merging** - local state masks race conditions

### Process Improvements:
- Consider adding a workspace-level verification script that checks all `typecheck` targets have `^build`
- Add this pattern to the AGENTS.md guidelines for consistent configuration
- When adding new root-level TypeScript files that import workspace packages, verify the target dependencies

## Prevention

### Checklist for New TypeScript Targets:

When creating a new target that runs TypeScript (`tsc`, `vite build`, etc.):

- [ ] Does it import workspace packages (like `@8f4e/*` or `glugglug`)?
- [ ] If yes, does the target's `dependsOn` include `"^build"`?
- [ ] Test with a clean build: `rm -rf packages/**/dist && npm run build`
- [ ] Verify in CI before merging

### Automated Verification:

Consider adding a lint rule or script:

```bash
# Verify all typecheck targets have ^build dependency
npx nx show project app --json | jq '.targets.typecheck.dependsOn | contains(["^build"])'
```

## Related Files

- `/project.json` - Root app configuration with `typecheck` target
- `/tsconfig.json` - Root TypeScript configuration (uses `moduleResolution: "bundler"`)
- `/packages/editor/packages/editor-state/package.json` - Declares `"types": "./dist/index.d.ts"`
- `/src/examples/modules/amenBreak64Step.ts` - File that imports `@8f4e/editor-state`

## References

- [Previous Postmortem: sprite-generator CI Build Failures](./2025-11-01-sprite-generator-ci-build-failure.md)
- [Nx Task Pipeline Configuration](https://nx.dev/concepts/task-pipeline-configuration)
- [Nx dependsOn Documentation](https://nx.dev/reference/project-configuration#dependson)

## Conclusion

This incident validates the value of documenting postmortems with detailed root cause analysis. The previous postmortem enabled a 5-minute fix instead of potentially hours of investigation. Moving forward, we should continue documenting these patterns and consider automated checks to prevent similar configuration issues.
