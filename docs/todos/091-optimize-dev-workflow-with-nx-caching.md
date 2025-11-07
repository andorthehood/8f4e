---
title: 'TODO: Optimize Dev Workflow with Nx Caching and Incremental Builds'
priority: High
effort: 2-3 days
created: 2025-11-07
status: Open
completed: null
---

# TODO: Optimize Dev Workflow with Nx Caching and Incremental Builds

## Problem Description

The current development setup is inefficient and doesn't leverage Nx's powerful caching capabilities:

**Current State:**
- `npm run dev` runs `vite` directly via the `app:dev` target
- Vite config uses conditional aliases that point to **source files** in dev mode (e.g., `packages/editor/src/index.ts`)
- Vite processes all monorepo package source files on initial startup and transforms them on-demand
- The `dev` target has `dependsOn: ["^build"]` which pre-builds all dependencies, but this is **redundant** since Vite re-processes everything from source anyway
- Nx's computation caching is completely bypassed during development (no cache reuse between dev sessions or across machines)

**Why This Is a Problem:**
- Wasted initial build time: packages are built once via tsc, then Vite ignores those outputs and processes source files instead
- No cross-session caching: Cold dev server starts process all files without Nx cache benefits (unlike `nx build` which reuses cached outputs)
- No distributed cache benefits: In CI or across team members, Nx could share cached library builds, but dev mode rebuilds from source
- Missing incremental library builds: When a library changes, Vite transforms it from source; Nx could build it once to dist/ with caching
- Slower initial dev server startup than theoretically possible with Nx's computation caching

**Impact:**
- Slower cold-start dev server (every developer, every day, processes all files from scratch)
- No benefit from Nx's distributed cache during development (only during production builds)
- Poor developer experience as the codebase grows (more packages = more files to process on every cold start)
- Not utilizing the monorepo tooling we've invested in for the most frequent operation (starting dev server)

## Proposed Solution

Implement a development workflow where Nx manages incremental builds of dependencies and Vite only serves the root application, consuming built outputs from `dist/` folders.

**High-Level Approach:**

### Option A: @nx/vite:dev-server Executor (Recommended)
Use Nx's official Vite plugin with the `@nx/vite:dev-server` executor, which may have built-in support for watching and rebuilding library dependencies.

**Pros:**
- Official Nx solution, well-maintained
- May handle dependency watching automatically
- Single command to run (`nx serve app`)
- Integrates with Nx's task orchestration
- Future-proof as Nx team improves it

**Cons:**
- Need to verify it actually rebuilds dependencies (not clear from docs)
- May still require Vite aliases to point to dist/ in dev mode
- Documentation is unclear about buildLibsFromSource behavior

### Option B: nx watch + Vite (Manual Orchestration)
Manually orchestrate `nx watch` for dependencies and Vite dev server.

**Pros:**
- Full control over the workflow
- Explicitly rebuilds affected packages using Nx caching
- Clear separation of concerns

**Cons:**
- Requires running two processes (can use `concurrently` or Nx terminal UI)
- More complex setup
- Manual coordination needed

### Option C: Nx Terminal UI with Continuous Tasks (Modern Nx 21+)
Use Nx 21+'s improved terminal UI and continuous task management to run dev server with dependent watch tasks.

**Pros:**
- Cleaner UI for managing multiple processes
- Native Nx support for continuous tasks
- Better log management

**Cons:**
- Still requires coordinating multiple processes
- May still need aliases configuration
- Newer feature, less battle-tested

## Implementation Plan

### Phase 1: Research & Validation (1 day)

#### Step 1.1: Test @nx/vite:dev-server
- Update `app:dev` target to use `@nx/vite:dev-server` executor
- Test if it automatically watches and rebuilds dependencies
- Profile startup time and HMR performance
- Verify Nx caching is utilized

#### Step 1.2: Test nx watch Approach
- Modify Vite aliases to always point to `dist/` (remove isDev condition)
- Set up `nx watch --all --includeDependentProjects -- nx run $NX_PROJECT_NAME:dev`
- Run Vite dev server separately
- Test HMR and rebuild performance
- Verify Nx caching is utilized

#### Step 1.3: Benchmark Both Approaches
- Measure initial startup time
- Measure HMR speed for:
  - Changes in root app
  - Changes in immediate dependencies (e.g., @8f4e/editor)
  - Changes in nested dependencies (e.g., @8f4e/editor-state)
- Test with cold cache and warm cache
- Document findings

### Phase 2: Implementation (1 day)

#### Step 2.1: Update Vite Configuration
```typescript
// vite.config.mjs
resolve: {
  alias: {
    // Always point to dist in dev mode to consume built outputs
    '@8f4e/editor': resolvePath('packages/editor/dist'),
    '@8f4e/editor-state': resolvePath('packages/editor/packages/editor-state/dist'),
    // ... etc
  }
}
```

#### Step 2.2: Update App Project Configuration
Based on chosen approach:

**If using @nx/vite:dev-server:**
```json
// project.json
{
  "targets": {
    "dev": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "config": "vite.config.mjs"
      },
      "dependsOn": ["^build"] // May not be needed
    }
  }
}
```

**If using nx watch:**
```json
// project.json
{
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx watch --all --includeDependentProjects -- nx run $NX_PROJECT_NAME:dev",
          "vite"
        ],
        "parallel": true
      }
    }
  }
}
```

#### Step 2.3: Update Package Dev Targets
Ensure all packages have efficient `dev` targets that use `tsc --watch`:
```json
// packages/*/project.json
{
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --watch",
        "cwd": "{projectRoot}"
      }
    }
  }
}
```

#### Step 2.4: Update npm Scripts
```json
// package.json
{
  "scripts": {
    "dev": "nx run app:dev",
    "dev:watch-packages": "nx watch --all --includeDependentProjects -- nx run $NX_PROJECT_NAME:dev",
    "dev:vite": "vite"
  }
}
```

### Phase 3: Testing & Validation (0.5 days)

#### Step 3.1: Functional Testing
- [ ] Dev server starts successfully
- [ ] HMR works for root app changes
- [ ] Changes in packages trigger rebuild and HMR
- [ ] Nested package dependencies rebuild correctly
- [ ] Build errors are surfaced properly
- [ ] TypeScript declarations are generated

#### Step 3.2: Performance Validation
- [ ] Initial startup is faster than current setup
- [ ] HMR is as fast or faster than current setup
- [ ] Nx cache is utilized (verify with `nx reset` and re-run)
- [ ] Memory usage is reasonable
- [ ] No excessive file watching (check open file handles)

### Phase 4: Documentation (0.5 days)

#### Step 4.1: Update Repository Guidelines
Update root `AGENTS.md` or README with:
- Explanation of new dev workflow
- How Nx caching benefits development
- Troubleshooting tips (e.g., when to run `nx reset`)

#### Step 4.2: Update Package Guidelines
Update package-level `AGENTS.md` files to clarify:
- Dev mode now consumes built outputs
- Importance of `dev` target for watch mode
- Build target must output to `dist/`

## Success Criteria

- [ ] Dev server startup time is reduced by at least 30%
- [ ] Nx cache is utilized during development (verified with `nx show project app --web`)
- [ ] HMR performance is maintained or improved
- [ ] Only affected packages rebuild on changes (not all packages)
- [ ] Single `npm run dev` command starts everything (no manual process management)
- [ ] All packages work correctly when consumed from `dist/` in dev mode
- [ ] TypeScript errors from dependencies show up in IDE
- [ ] Documentation is updated

## Affected Components

- `vite.config.mjs` - Alias configuration
- `project.json` (root) - dev target executor
- `nx.json` - targetDefaults for dev
- `packages/*/project.json` - dev targets
- `package.json` - npm scripts
- Root `AGENTS.md` or README - developer documentation
- Package `AGENTS.md` files - package-specific guidelines

## Risks & Considerations

### Risk 1: HMR Might Not Work with Built Outputs
**Description:** Vite's HMR might not work smoothly when consuming from `dist/` instead of source files.

**Mitigation:**
- Test thoroughly in Phase 1
- Ensure source maps are generated (`"declarationMap": true` in tsconfig)
- If HMR breaks, fall back to source aliases but use nx watch to pre-build

### Risk 2: Type Declarations Delay
**Description:** TypeScript might not pick up type changes immediately if declarations are built separately.

**Mitigation:**
- Ensure `tsc --watch` generates `.d.ts` files quickly
- Test IDE experience during development
- Consider using TypeScript project references if needed

### Risk 3: Worker Bundles Complexity
**Description:** Some packages like `@8f4e/runtime-audio-worklet` use Vite for bundling, not just tsc. Their dev target might need special handling.

**Mitigation:**
- Audit all package build processes
- Ensure worker packages have proper dev targets
- May need custom watch commands for Vite-bundled workers

### Risk 4: Debugging Source Maps
**Description:** Debugging might be harder when stepping through built code instead of source.

**Mitigation:**
- Ensure source maps are properly configured
- Test debugger source mapping in Chrome DevTools
- Document how to navigate to source files

### Risk 5: Initial Build Required
**Description:** Developers must run `nx build` before first dev server start, which wasn't required before.

**Mitigation:**
- Make `dev` target depend on `^build` to handle this automatically
- Document in onboarding materials
- Add error messages if dist/ folders are missing

## Related Items

- **Related**: `docs/todos/090-remove-webassembly-memory-dependency-from-editor-state.md` - Both improve editor architecture
- **Depends on**: None
- **Blocks**: Future performance optimizations that depend on proper Nx caching

## References

- [Nx Vite Plugin Documentation](https://nx.dev/technologies/build-tools/vite/introduction)
- [Nx watch Command](https://nx.dev/nx-api/nx/documents/watch)
- [Nx Terminal UI for Continuous Tasks](https://www.youtube.com/watch?v=Nt1fDg_oFYg)
- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

## Notes

### About Vite's Caching
**What Vite DOES cache well:**
- Module transformations during HMR (within a dev session)
- Dependency pre-bundling in `node_modules/.vite/deps` (persists across sessions)
- HTTP 304 responses for unchanged files served to the browser

**What Vite DOESN'T cache:**
- Transformations of monorepo source files (processed fresh on every cold start)
- Build outputs of workspace packages (no concept of this - Vite works with source)
- Computation results across machines/CI (no distributed cache like Nx)

The core issue isn't Vite's caching - it's that Vite operates on source files, while Nx operates on build artifacts with distributed computation caching.

### Current Package Build Methods
- Most packages: `tsc` for build, `tsc --watch` for dev
- `@8f4e/runtime-audio-worklet`: Uses Vite with `vite.config.worklet.ts`
- Some packages have separate `bundle` targets using Vite (separate from `build`)

### Key Insights from Research
1. `@nx/vite` is already installed and used for testing (`@nx/vite:test`)
2. All packages already have `dev` targets with watch mode
3. The `dev:watch-packages` script already exists but isn't used in the main dev workflow
4. Current setup already builds dependencies before dev (via `dependsOn: ["^build"]`), so there's no new "initial build" penalty to worry about

### Decision Log
- **2025-11-07**: TODO created, research phase initiated
- **Next**: Complete Phase 1 benchmarking to choose best approach

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `docs/todos/archived/` folder
3. Update `docs/todos/_index.md` to move from Active to Completed section
4. Include benchmark results and chosen approach in the final notes

