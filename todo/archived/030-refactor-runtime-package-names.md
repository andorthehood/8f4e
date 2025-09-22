# TODO: Refactor Runtime Package Names

**Priority**: 🟢
**Estimated Effort**: 2-3 hours
**Created**: 2025-08-27
**Status**: Completed
**Completed**: 2025-09-04

## Problem Description

The current runtime package naming convention places "runtime" at the end of the package name (e.g., `audio-worklet-runtime`, `web-worker-logic-runtime`, `web-worker-midi-runtime`). This naming pattern is inconsistent with common package naming conventions and makes it harder to group related runtime packages together.

**Current naming:**
- `@8f4e/audio-worklet-runtime`
- `@8f4e/web-worker-logic-runtime`
- `@8f4e/web-worker-midi-runtime`

**Proposed naming:**
- `@8f4e/runtime-audio-worklet`
- `@8f4e/runtime-web-worker-logic`
- `@8f4e/runtime-web-worker-midi`

## Proposed Solution

Refactor all runtime package names to move "runtime" to the beginning, creating a more logical grouping and consistent naming convention. This change will:

- Group all runtime packages under the `@8f4e/runtime-*` namespace
- Make it easier to identify runtime-related packages
- Improve package organization and discoverability
- Follow common package naming patterns

## Implementation Plan

### Step 1: Rename Package Directories
- Rename `packages/audio-worklet-runtime/` to `packages/runtime-audio-worklet/`
- Rename `packages/web-worker-logic-runtime/` to `packages/runtime-web-worker-logic/`
- Rename `packages/web-worker-midi-runtime/` to `packages/runtime-web-worker-midi/`

### Step 2: Update Package Configuration Files
- Update `package.json` files in each runtime package with new names
- Update `project.json` files with new names
- Update `tsconfig.json` files if they contain package-specific paths

### Step 3: Update Import References
- Update `vite.config.mjs` with new package aliases
- Update all import statements throughout the codebase
- Update factory file names to match new package names:
  - `audio-worklet-runtime-factory.ts` → `runtime-audio-worklet-factory.ts`
  - `web-worker-logic-runtime-factory.ts` → `runtime-web-worker-logic-factory.ts`
  - `web-worker-midi-runtime-factory.ts` → `runtime-web-worker-midi-factory.ts`

### Step 4: Update Dependencies and References
- Update `packages/editor/package.json` dependencies
- Update any hardcoded references in documentation
- Update `docs/nx-workflow.md` with new package names
- Update any import statements in source files

### Step 5: Test and Verify
- Ensure all packages build successfully with new names
- Verify that imports resolve correctly
- Test that the application runs without errors
- Update any CI/CD configurations if necessary

## Success Criteria

- [ ] All runtime package directories renamed successfully
- [ ] Package names updated in all configuration files
- [ ] All import statements updated throughout the codebase
- [ ] Factory file names updated to match new package names
- [ ] Application builds and runs without errors
- [ ] Documentation updated with new package names
- [ ] No broken imports or references remain

## Affected Components

### Package Directories
- `packages/audio-worklet-runtime/` → `packages/runtime-audio-worklet/`
- `packages/web-worker-logic-runtime/` → `packages/runtime-web-worker-logic/`
- `packages/web-worker-midi-runtime/` → `packages/runtime-web-worker-midi/`

### Configuration Files
- `vite.config.mjs` - Package aliases
- `packages/editor/package.json` - Dependencies
- All runtime package `package.json` files
- All runtime package `project.json` files

### Source Files
- `src/audio-worklet-runtime-factory.ts` → `src/runtime-audio-worklet-factory.ts`
- `src/web-worker-logic-runtime-factory.ts` → `src/runtime-web-worker-logic-factory.ts`
- `src/web-worker-midi-runtime-factory.ts` → `src/runtime-web-worker-midi-factory.ts`
- `src/editor.ts` - Import statements
- `docs/nx-workflow.md` - Package references

### Import Statements
- All files importing from runtime packages
- Factory function imports in main application
- Any test files that import runtime packages

## Risks & Considerations

- **Breaking Changes**: This is a breaking change that affects all import statements
- **Git History**: Directory renames may affect git history and blame information
- **Dependencies**: External dependencies or CI/CD systems may need updates
- **Testing**: All import paths need thorough testing to ensure no broken references
- **Documentation**: All documentation and examples need updates
- **IDE Integration**: IDEs may need to re-index the workspace after directory changes

## Related Items

- **Depends on**: No other TODOs depend on this
- **Blocks**: Future runtime package development will use new naming convention
- **Related**: The new `main-thread-logic-runtime` package should use the new naming convention (`runtime-main-thread-logic`)

## References

- [NPM Package Naming Conventions](https://docs.npmjs.com/creating-a-package-json-file#name)
- [Monorepo Package Organization Best Practices](https://nx.dev/concepts/more-concepts/why-monorepos)

## Notes

- This refactoring should be done before creating the new `main-thread-logic-runtime` package to ensure consistency
- Consider using git's `git mv` command to preserve history when renaming directories
- Update any IDE workspace configurations after the refactoring
- This change will require a major version bump if these packages are published externally

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 