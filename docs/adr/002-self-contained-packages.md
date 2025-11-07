# ADR-002: Self-Contained Package Configurations

**Date**: 2025-11-07

**Status**: Accepted

## Context

Our packages originally used a shared TypeScript configuration approach:

1. **Shared Base Configuration**: All packages extended a root `tsconfig.json` or `tsconfig.base.json`, inheriting common compiler options.

2. **Tight Coupling**: This created coupling between packages and the root project structure. Moving a package or understanding its configuration required knowledge of the root config hierarchy.

3. **Path Mapping Leakage**: When we introduced path mappings in the root config for source-based development (see [ADR-001](001-source-based-development.md)), these mappings leaked into package builds via `extends`, causing TypeScript errors about files outside `rootDir`.

4. **Less Portable**: Packages weren't truly self-contained - extracting a package for use elsewhere or publishing it would require understanding and replicating the shared configuration.

5. **Implicit Dependencies**: Package configurations implicitly depended on the root structure, making it harder to reason about package builds in isolation.

## Decision

We made each package's `tsconfig.json` completely self-contained with no external dependencies.

### Package Configuration Structure

Each package now has a complete TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2023"],  // or ["es2023", "dom"] or ["es2023", "webworker"]
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "strict": true,
    "downlevelIteration": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": []
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "src/**/*.test.ts"]
}
```

### Lib Configuration by Package Type

Different packages have different `lib` settings based on their runtime environment:

- **Pure logic packages** (e.g., `@8f4e/compiler`): `["es2023"]`
- **DOM packages** (e.g., `glugglug`, `@8f4e/web-ui`): `["es2023", "dom"]`
- **WebWorker packages** (e.g., `@8f4e/compiler-worker`, `@8f4e/runtime-web-worker-*`): `["es2023", "webworker"]`

### No Shared Base Configuration

We removed the `tsconfig.base.json` file that packages previously extended. The root `tsconfig.json` serves only the root app and is not extended by any packages.

### Root vs Package Configurations

The root and package configurations serve different purposes:

**Root `tsconfig.json`**:
- Used by the IDE for type-checking the root app
- Contains `paths` mappings to package source files (for dev experience)
- Includes only root app files (`src/editor.ts`, `src/examples/**/*.ts`)
- Explicitly excludes all packages

**Package `tsconfig.json`**:
- Used for building that specific package
- No `paths` mappings - uses standard npm resolution via `package.json`
- Includes only that package's source files
- Configured to emit declarations to `dist/`

## Consequences

### Positive

1. **True Package Independence**: Each package is completely self-contained. You can understand a package's TypeScript configuration by looking at just that one file.

2. **No Configuration Leakage**: Path mappings and other root-specific config don't affect package builds. Each package builds in isolation exactly as configured.

3. **Easier Extraction/Publishing**: If we want to extract a package as a separate library or publish it to npm, no configuration changes are needed. It's already self-contained.

4. **Clear Responsibilities**: It's explicit what each config is for:
   - Root config: IDE experience for app development
   - Package config: Building that package

5. **No Mysterious Inheritance**: Developers don't need to trace through `extends` chains to understand what options are in effect for a package.

6. **Better IDE Support**: IDEs can properly understand each package's configuration without needing to resolve extends chains.

### Negative

1. **Configuration Duplication**: Common compiler options are duplicated across all package `tsconfig.json` files. If we want to change a shared option (e.g., target version), we need to update multiple files.

   **Mitigation**: This is acceptable because:
   - TypeScript options are relatively stable
   - Different packages might legitimately need different options
   - We can script updates if needed
   - Clarity and independence are worth the duplication

2. **No Single Source of Truth**: There's no one place to see "the project's TypeScript configuration." 

   **Mitigation**: This is actually accurate - there is no single configuration. The root app and each package are separate compilation units with their own needs.

3. **Initial Setup Effort**: Adding a new package requires copying and customizing a complete `tsconfig.json` rather than just extending a base.

   **Mitigation**: This happens rarely, and having a complete config as a template is straightforward. The explicit nature makes it clearer what needs to be configured.

### Neutral

- **Package builds work the same**: The actual build output and behavior is unchanged, only the configuration structure changed.
- **Root app type checking unchanged**: The root app's IDE experience is still controlled by the root `tsconfig.json`.

## Implementation Notes

### Files Created

No new files were created; packages already had `tsconfig.json` files.

### Files Modified

All package `tsconfig.json` files were updated to:
1. Remove `"extends"` field
2. Add complete compiler options directly
3. Configure appropriate `lib` settings based on runtime environment

**Packages updated**:
- `packages/compiler/tsconfig.json`
- `packages/compiler-worker/tsconfig.json`
- `packages/runtime-audio-worklet/tsconfig.json`
- `packages/runtime-main-thread-logic/tsconfig.json`
- `packages/runtime-web-worker-logic/tsconfig.json`
- `packages/runtime-web-worker-midi/tsconfig.json`
- `packages/editor/tsconfig.json`
- `packages/editor/packages/editor-state/tsconfig.json`
- `packages/editor/packages/glugglug/tsconfig.json`
- `packages/editor/packages/sprite-generator/tsconfig.json`
- `packages/editor/packages/state-manager/tsconfig.json`
- `packages/editor/packages/web-ui/tsconfig.json`

### Files Removed

- **`tsconfig.base.json`**: No longer needed since packages don't extend anything.

### Standard Options Applied

All packages received these common options:
```json
{
  "target": "es2022",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "strict": true,
  "skipLibCheck": true,
  "forceConsistentCasingInFileNames": true,
  "esModuleInterop": true,
  "allowSyntheticDefaultImports": true,
  "resolveJsonModule": true,
  "isolatedModules": true,
  "downlevelIteration": true
}
```

### Package-Specific Options

Some packages retained their specific options:
- **glugglug**: `"strict": false`, `"strictNullChecks": false` (legacy code)
- **state-manager**: Custom configuration (different target/module)

## Alternatives Considered

### 1. Keep Shared Base Configuration

**Rejected**: This was the status quo that caused problems when we added path mappings to the root config. The coupling between root and packages was problematic and prevented true independence.

### 2. Two-Level Configuration Hierarchy

**Considered**: Having `tsconfig.base.json` for shared options and `tsconfig.root.json` for root-specific options (including paths), with packages extending only the base.

**Rejected**: This still creates coupling and doesn't solve the core issue - packages depending on external configuration. The duplication cost is acceptable for the independence gained.

### 3. Generate Package Configs from Template

**Considered**: Using a script to generate package `tsconfig.json` files from a template.

**Rejected**: Over-engineered for the problem. We don't add packages frequently enough to justify the complexity. Manual copying with a good template is sufficient.

### 4. Nx's TypeScript Plugin Presets

**Considered**: Using Nx's built-in TypeScript configuration presets.

**Rejected**: Nx presets still use inheritance and don't provide the level of independence we want. They're designed for shared configuration, not self-contained packages.

## Related Decisions

See [ADR-001: Source-Based Development Mode](001-source-based-development.md) for the decision that motivated making packages self-contained (to prevent path mapping leakage).

## References

- TypeScript configuration documentation: https://www.typescriptlang.org/tsconfig
- TypeScript extends behavior: https://www.typescriptlang.org/tsconfig#extends
- Nx TypeScript configuration: https://nx.dev/recipes/tips-n-tricks/advanced-typescript-support

