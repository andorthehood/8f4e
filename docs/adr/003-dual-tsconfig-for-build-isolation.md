# ADR-003: Dual TypeScript Configuration for Build Isolation

**Date**: 2025-11-07

**Status**: Accepted

## Context

Our monorepo has multiple TypeScript packages with varying strictness levels and type requirements. We encountered a conflict between three competing needs:

1. **Development Experience**: The IDE needs to resolve package types from source files for live type updates when editing packages, without requiring rebuilds.

2. **Build Isolation**: Each package should be typechecked with its own TypeScript configuration. The root app's strict settings should not bleed into packages like `glugglug` that intentionally use looser settings (`strict: false`, `strictNullChecks: false`).

3. **Root Typechecking**: The root application code (`src/editor.ts`, `src/examples/**/*.ts`) must be typechecked during builds to catch type errors before deployment.

### The Problem

When the root `tsconfig.json` pointed to package source files (for dev experience), running `tsc --noEmit` would follow those imports and apply the root's strict TypeScript settings to all package source files. This caused build failures with errors like:

```
packages/editor/packages/glugglug/src/engine.ts(21,2): error TS2564: 
  Property 'lastRenderFinishTime' has no initializer and is not definitely assigned in the constructor.
```

These errors only appeared during the root typecheck, not during individual package builds, because the root's strict settings were being applied to package code.

### Failed Approaches

1. **Pointing to `.d.ts` files in `tsconfig.json`**: This broke IDE type checking during development - types wouldn't update without rebuilding packages.

2. **Removing root typecheck from build**: This left root application code unchecked, allowing type errors to slip into production.

3. **Using `exclude` patterns**: The `exclude: ["node_modules", "packages/**/*"]` in `tsconfig.json` didn't help because TypeScript follows import declarations regardless of exclude patterns.

## Decision

We implemented a dual TypeScript configuration approach that separates development-time type checking from build-time type checking.

### 1. Main Configuration (`tsconfig.json`)

Used by the IDE and development tools. Points to **source files** for live type updates:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2023", "dom", "dom.iterable"],
    "strict": true,
    "paths": {
      "@8f4e/editor": ["packages/editor/src/index.ts"],
      "@8f4e/compiler": ["packages/compiler/src/index.ts"],
      "glugglug": ["packages/editor/packages/glugglug/src/index.ts"],
      // ... all packages point to src/index.ts
    }
  },
  "exclude": ["node_modules", "packages/**/*", "src/**/*.test.ts", "dist"],
  "include": ["src/editor.ts", "src/examples/**/*.ts"]
}
```

### 2. Build Configuration (`tsconfig.build.json`)

Used exclusively for the root application typecheck during builds. Points to **declaration files**:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@8f4e/editor": ["packages/editor/dist/index.d.ts"],
      "@8f4e/compiler": ["packages/compiler/dist/index.d.ts"],
      "glugglug": ["packages/editor/packages/glugglug/dist/index.d.ts"],
      // ... all packages point to dist/index.d.ts
    }
  }
}
```

### 3. Updated Build Process

Modified `project.json` to use the build configuration:

```json
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit --project tsconfig.build.json",
        "cwd": "{workspaceRoot}"
      },
      "dependsOn": ["^build"]
    },
    "build": {
      "dependsOn": ["typecheck", "^build"]
    }
  }
}
```

### 4. Package TypeScript Configuration Updates

Fixed type errors by adding DOM types where needed:

```json
{
  "compilerOptions": {
    "lib": ["es2023", "DOM"]
  }
}
```

Applied to:
- `packages/runtime-main-thread-logic/tsconfig.json`
- `packages/editor/tsconfig.json`
- `packages/editor/packages/sprite-generator/tsconfig.json`

## Consequences

### Positive

1. **Optimal Development Experience**: Developers see live type updates in their IDE when editing package code, with no rebuild required. TypeScript follows imports into source files, providing full IntelliSense and type checking.

2. **Proper Build Isolation**: Each package is typechecked only by its own configuration during its build step. Packages with looser settings (like `glugglug`) don't fail due to stricter root settings being applied.

3. **Complete Type Safety**: The root application code is still typechecked during builds using declaration files, ensuring no type errors slip into production while avoiding cross-contamination with package internals.

4. **Clean Separation of Concerns**: Build-time configuration is explicitly separate from IDE configuration, making the intent clear and reducing confusion.

### Negative

1. **Additional Configuration File**: We now have two TypeScript configurations to maintain (`tsconfig.json` and `tsconfig.build.json`). However, `tsconfig.build.json` extends the main config and only overrides the `paths`, minimizing duplication.

2. **Build Dependency Order**: The root typecheck depends on all packages being built first (to generate `.d.ts` files). This is enforced by `dependsOn: ["^build"]` but means the typecheck can't run in isolation during development.

3. **Not Immediately Obvious**: New contributors might be confused by the dual configuration setup initially. This requires documentation (this ADR and code comments).

## Implementation Details

### Build Flow

The complete build process now follows this order:

```
npm run build
  ├─ nx run app:build
      ├─ dependsOn: ["typecheck", "^build"]
      │
      ├─ ^build (all package builds run in parallel)
      │   ├─ @8f4e/compiler:build
      │   │   └─ tsc (with packages/compiler/tsconfig.json)
      │   ├─ @8f4e/editor:build
      │   │   └─ tsc (with packages/editor/tsconfig.json)
      │   ├─ glugglug:build
      │   │   └─ tsc (with packages/glugglug/tsconfig.json - strict: false)
      │   └─ ... all other packages
      │
      ├─ typecheck (runs after all packages built)
      │   └─ tsc --noEmit --project tsconfig.build.json
      │       └─ Checks src/editor.ts and src/examples/**/*.ts
      │       └─ Uses .d.ts files from built packages
      │
      └─ vite build (runs after typecheck passes)
          └─ Bundles the application
```

### Development Flow

During development (`npm run dev`):

1. Vite starts with aliases pointing to package source files
2. IDE uses `tsconfig.json` (points to source files)
3. TypeScript language server provides live type checking with full source visibility
4. No package builds are required for type checking
5. Hot module replacement works across package boundaries

### Type Resolution Priority

TypeScript resolves types in this order:

1. **Development**: IDE → `tsconfig.json` → package source files → live types
2. **Build**: tsc → `tsconfig.build.json` → package `.d.ts` files → published types

## Alternatives Considered

### 1. Single Configuration with Project References

TypeScript's project references feature (`"references": []`) could theoretically solve this, but:
- Requires significant restructuring of all package configurations
- Adds complexity to the build process
- Doesn't fully solve the IDE experience issue
- Complicates Vite's module resolution

### 2. Disabling Strict Mode in Root

Making the root less strict to accommodate packages would:
- Reduce type safety in application code
- Hide potential bugs in examples and main application
- Go against TypeScript best practices
- Not scale as we add more packages with varying strictness

### 3. Making All Packages Equally Strict

Enforcing strict mode across all packages would:
- Require significant refactoring of `glugglug` and other packages
- Break some intentional design choices (e.g., WebGL code that safely uses loose null checks)
- Not be worth the effort for packages that work correctly as-is

### 4. Separate Typecheck Command Without Build Dependency

Running `tsc --noEmit` without first building packages would:
- Fail because `.d.ts` files wouldn't exist
- Require maintaining `.d.ts` files in source control (bad practice)
- Lose the benefit of build-time type validation

## Related

- [ADR-001: Source-Based Development Mode](./001-source-based-development.md) - Established the pattern of pointing to source files for development
- [ADR-002: Self-Contained Packages](./002-self-contained-packages.md) - Describes package isolation principles

## References

- TypeScript Handbook: [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- TypeScript Issue: [Exclude doesn't prevent checking files when following imports](https://github.com/microsoft/TypeScript/issues/6571)
- Nx Documentation: [Task Pipeline Configuration](https://nx.dev/concepts/task-pipeline-configuration)

