---
title: 'TODO: Standardize Build Scripts Across Packages'
priority: �
effort: 1 day
created: 2025-08-23
status: Open
completed: null
---

# TODO: Standardize Build Scripts Across Packages

## Problem Description

The monorepo packages have inconsistent build scripts and configurations:

- **Missing build scripts**: Some packages have empty `"build": ""` commands
- **Inconsistent patterns**: Mix of TypeScript, Parcel, and custom build approaches
- **Different outputs**: Inconsistent dist directory structures and file naming
- **Missing scripts**: Some packages lack dev, test, or typecheck commands

Current inconsistencies:
- `packages/editor/package.json` - Empty build script
- `packages/audio-worklet-runtime` - Uses Parcel with custom targets
- `packages/compiler` - Uses TypeScript directly
- `packages/editor/packages/sprite-generator` - Has dev script with Parcel

## Proposed Solution

Standardize all package build scripts to use consistent patterns:

1. **Common scripts**: All packages should have `build`, `dev`, `test`, `typecheck`
2. **Consistent outputs**: Standardize dist directory structure
3. **Proper entry points**: Ensure `main`, `types`, `module` fields are correct
4. **Build optimization**: Consistent source maps, declarations, and optimization

## Implementation Plan

### Step 1: Audit Current State
- Document all existing build configurations
- Identify which packages need build outputs vs. source-only
- Determine standard script patterns to adopt
- Expected outcome: Clear inventory of required changes

### Step 2: Define Standards
- Choose standard build tools (TypeScript for libraries, prepare for Vite)
- Define consistent output directory structure
- Standardize package.json script names and behaviors
- Expected outcome: Written standards document for package configuration

### Step 3: Update Package Configurations
- Add missing build scripts where needed
- Ensure all packages have consistent script names
- Update package.json fields (main, types, module)
- Expected outcome: All packages follow standard patterns

### Step 4: Verify Integration
- Test that workspace dependencies resolve correctly
- Ensure root build command works for all packages
- Verify TypeScript compilation across workspace
- Expected outcome: Consistent build behavior across monorepo

## Success Criteria

- [ ] All packages have `build`, `dev`, `test`, `typecheck` scripts
- [ ] Empty build scripts are removed or implemented
- [ ] Consistent output directory structure across packages
- [ ] `npm run build --workspaces` completes successfully
- [ ] Package.json fields accurately reflect build outputs
- [ ] TypeScript path mapping works correctly for all packages

## Affected Components

- `packages/editor/package.json` - Add proper build script
- `packages/audio-worklet-runtime/package.json` - Standardize targets config
- All package.json files - Ensure consistent script patterns
- Root `package.json` - May need build script updates

## Risks & Considerations

- **Build changes**: Output structure changes might affect imports
- **Dependencies**: Changes to one package might affect others
- **Development workflow**: New scripts might change dev experience
- **Preparation work**: Should complete before Vite migration

## Related Items

- **Blocks**: `001-vite-migration.md` - Need consistent scripts before migration
- **Related**: TypeScript configuration improvements

## References

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Package.json Fields Reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

## Notes

- This work should happen before Vite migration to establish clean baseline
- Consider using TypeScript project references for better build performance
- Some packages may legitimately not need build outputs (e.g., pure source packages)
- Document the standards for future package additions 