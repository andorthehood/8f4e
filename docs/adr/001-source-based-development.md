# ADR-001: Source-Based Development Mode

**Date**: 2025-11-07

**Status**: Accepted

## Context

We encountered several developer experience issues in our Nx monorepo related to type resolution and development workflow:

1. **Stale Type Definitions**: When developing the root app, TypeScript in the IDE resolved types from package `dist/*.d.ts` files rather than source. This meant type information didn't update until packages were rebuilt, creating a frustrating development loop where you'd change a package source file but see no type updates until running a build.

2. **Slow Development Feedback**: Running `npm run dev` originally required watching package builds separately. We initially tried using `concurrently` to run both Vite and `nx watch` for package rebuilds, which added complexity and required managing multiple processes.

3. **No Differentiation Between Modes**: There was no distinction between development and production module resolution - both treated packages the same way, always resolving to built `dist/` output.

4. **Nx Cache Issues**: After switching git branches, Nx's computation hashing sometimes failed to detect that dependencies needed rebuilding, requiring manual `nx reset` to clear the cache.

## Decision

We implemented a dual-mode module resolution strategy where development resolves to source files while production uses built output.

### Vite Configuration

In `vite.config.mjs`, we added conditional alias resolution:

```javascript
export default defineConfig(({ command }) => {
  const resolvePath = (path) => resolve(__dirname, path)
  const isDev = command === 'serve'

  return {
    resolve: {
      alias: {
        '@8f4e/editor': resolvePath(isDev 
          ? 'packages/editor/src/index.ts'      // Dev: source files
          : 'packages/editor/dist'),             // Build: compiled output
        '@8f4e/compiler': resolvePath(isDev 
          ? 'packages/compiler/src/index.ts' 
          : 'packages/compiler/dist'),
        // ... same pattern for all packages
      }
    }
  }
})
```

### TypeScript Configuration

In the root `tsconfig.json`, we added path mappings to source files:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@8f4e/editor": ["packages/editor/src/index.ts"],
      "@8f4e/compiler": ["packages/compiler/src/index.ts"],
      // ... maps to source files for all packages
    }
  },
  "include": [
    "src/editor.ts",
    "src/examples/**/*.ts"
  ],
  "exclude": ["node_modules", "packages/**/*", "src/**/*.test.ts", "dist"]
}
```

### Simplified Dev Target

In root `project.json`, we removed the build dependency from the dev target:

```json
{
  "dev": {
    "executor": "nx:run-commands",
    "options": {
      "command": "vite",
      "cwd": "{workspaceRoot}"
    }
    // No dependsOn: ["^build"] for dev mode
  }
}
```

### Simplified Dev Script

In `package.json`, we simplified the dev script back to a single command:

```json
{
  "scripts": {
    "dev": "npx nx run app:dev"
  }
}
```

## Consequences

### Positive

1. **Instant Type Updates**: TypeScript in the IDE sees source file changes immediately without rebuilding packages. This solves the primary developer pain point - change a type in a package, see it update instantly in consuming code.

2. **Instant Hot Module Replacement**: Changes to package source files trigger Vite's HMR immediately. No separate build process needed during development.

3. **Faster Dev Startup**: `npm run dev` starts instantly without waiting for all packages to build first. Initial builds still happen once via Nx dependencies, but subsequent restarts are immediate.

4. **Simpler Dev Workflow**: Single command (`npm run dev`), single process to manage. No need for `concurrently` or managing multiple terminal windows.

5. **Clear Separation of Concerns**: Development (source-based) vs production (optimized builds) modes are explicit in the config. The `isDev` flag makes the distinction clear.

6. **Better Vite Integration**: Vite can now properly watch and transform package source files, enabling its full feature set (HMR, optimization, transforms) across the entire monorepo during development.

### Negative

1. **Visible Package Internals**: The IDE now shows type errors from package implementation details that were previously hidden by `.d.ts` files. For example, uninitialized class properties or internal implementation issues that are fine at runtime but trigger strict TypeScript checks.

   This is arguably more correct (you see the real types) but can be noisy. These errors don't affect runtime or builds since packages compile themselves independently.

2. **Divergent Dev and Prod Paths**: Development and production now use different module resolution strategies. While this is explicit and intentional, it does mean there's a slight risk of dev/prod differences.

   **Mitigation**: Production builds still use the same built `dist/` output that packages always used, so the production path is unchanged and proven.

3. **Initial Build Still Required**: On first `npm run dev` after a clean checkout or branch switch, Nx still builds all packages once (via the `^build` dependencies that remain for other targets like `build` and `typecheck`). This is acceptable since it only happens once per session.

### Neutral

- **Production builds unchanged**: Still require packages to build to `dist/` first, then Vite bundles using those built outputs. Production behavior is completely unchanged.
- **Package builds work as before**: Running `nx run <package>:build` still works the same way.
- **Nx features preserved**: Dependency graph, affected commands, and caching still function normally.

## Implementation Notes

### Files Modified

- **`vite.config.mjs`**: Added `isDev` condition for conditional alias resolution
- **`tsconfig.json`**: Added `baseUrl` and `paths` mapping all packages to their source entry points
- **`project.json`**: Removed `dependsOn: ["^build"]` from dev target only (kept for build and typecheck targets)
- **`package.json`**: Simplified dev script from `concurrently` back to simple Nx command

### Worker and Worklet Handling

Special note on workers and worklets: They use Vite's special import syntax (`?worker` and `?url` suffixes) which Vite handles correctly whether resolving to source or dist:

```typescript
import audioWorkletUrl from '@8f4e/runtime-audio-worklet?url';
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';
```

Vite processes these correctly in both dev (source) and build (dist) modes.

## Alternatives Considered

### 1. Keep Dist-Based Resolution with Package Watchers

**Rejected**: This was the status quo that created the developer pain. Would require:
- Running `nx watch --all` in parallel with Vite
- Managing multiple processes via `concurrently`
- Waiting for package rebuilds before seeing type updates
- More complex development setup

### 2. TypeScript Project References

**Considered but rejected**: TypeScript's project references feature could solve type resolution but:
- Adds significant complexity to build orchestration
- Requires careful configuration of references between projects
- Nx doesn't have first-class support for project references
- Would still require watching and rebuilding for type updates
- May revisit if the current solution proves insufficient

### 3. Single-Package Monorepo

**Rejected**: Merging all packages into a single package would eliminate the issue but:
- Loses modular architecture
- Makes it harder to have separate build configurations per package
- Reduces code organization and boundaries
- Goes against the stated goal of having independent, potentially publishable packages

### 4. Workspace Protocol or npm Workspaces

**Rejected**: Using `workspace:*` protocol or relying purely on npm workspaces:
- Still resolves to built `dist/` output via `package.json` `main`/`exports` fields
- Doesn't solve the stale types problem
- Doesn't integrate with Vite's module resolution

## Related Decisions

See [ADR-002: Self-Contained Package Configurations](002-self-contained-packages.md) for the decision to make package TypeScript configurations independent of the root config.

## References

- Vite documentation on module resolution: https://vitejs.dev/config/shared-options.html#resolve-alias
- TypeScript path mapping: https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
- Vite dev server command detection: https://vitejs.dev/config/#conditional-config

