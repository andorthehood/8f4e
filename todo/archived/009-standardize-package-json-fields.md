# TODO: Standardize Package.json Fields Across All Packages

**Priority**: 🟡  
**Estimated Effort**: 2-3 hours  
**Created**: 2025-08-25  
**Status**: ✅ Completed  

## Problem Description

The project has significant inconsistencies in package.json files across packages, which will cause issues during Vite migration and create maintenance problems:

**Missing critical fields:**
- `audio-worklet-runtime` and `web-worker-*` packages lack `main`, `types`, and `exports` fields
- No packages have `"type": "module"` for ES module compatibility
- Missing `"sideEffects": false"` for tree-shaking optimization

**Inconsistent field presence:**
- Some packages have `description` while others don't
- Some packages have `devDependencies` while others don't
- Inconsistent `scripts` structure across packages

**Build system inconsistencies:**
- Some packages use `tsc` for building, others use `parcel`
- `audio-worklet-runtime` has Parcel-specific `targets` configuration
- Different build output strategies across packages

**Current problematic examples:**
```json
// audio-worklet-runtime - missing main/types/exports
{
  "name": "@8f4e/audio-worklet-runtime",
  // Missing: main, types, exports, type
  "scripts": {
    "build": "parcel build --no-source-maps"  // Parcel-specific
  }
}

// sprite-generator - inconsistent with others
{
  "name": "@8f4e/sprite-generator",
  "main": "dist/index.js",  // Has main/types
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "parcel visual-testing/index.html..."  // Parcel-specific
  }
}
```

## Proposed Solution

Standardize all package.json files with consistent, Vite-compatible configurations:

1. **Add missing essential fields** to all packages
2. **Standardize on ES modules** with `"type": "module"`
3. **Consistent build scripts** that work with both current setup and Vite
4. **Add exports field** for better module resolution
5. **Remove Parcel-specific configurations** that won't work with Vite

## Implementation Plan

### Step 1: Audit all package.json files
- Review each package for missing required fields
- Document current inconsistencies
- Identify Parcel-specific configurations to remove
- Expected outcome: Complete inventory of needed changes

### Step 2: Create standardized package.json template
- Define required fields for all packages
- Create consistent script structure
- Define proper exports field structure
- Expected outcome: Template for all packages to follow

### Step 3: Update core packages first
- Update `compiler`, `2d-engine`, `sprite-generator` packages
- Add `"type": "module"`, `"exports"`, `"sideEffects": false"`
- Standardize scripts and dependencies
- Expected outcome: Core packages have consistent configuration

### Step 4: Update runtime packages
- Update `audio-worklet-runtime`, `web-worker-*` packages
- Add missing `main`, `types`, `exports` fields
- Remove Parcel-specific `targets` configuration
- Expected outcome: Runtime packages have proper module configuration

### Step 5: Update editor package
- Ensure editor package follows same standards
- Update any package-specific configurations
- Test that all imports still resolve correctly
- Expected outcome: Editor package is consistent with others

### Step 6: Test and validate
- Run `npm run typecheck` across all packages
- Test build process for each package
- Verify no import/export issues introduced
- Expected outcome: All packages work correctly with new configuration

## Success Criteria

- [x] All packages have consistent package.json structure
- [x] All packages include `"type": "module"`
- [x] All packages have proper `main`, `types`, and `exports` fields
- [x] All packages have `"sideEffects": false"`
- [x] No Parcel-specific configurations remain
- [x] All packages can be built and imported correctly
- [x] Configuration is ready for Vite migration

## Affected Components

- `packages/compiler/package.json` - Standardize fields and scripts
- `packages/2d-engine/package.json` - Add missing fields
- `packages/sprite-generator/package.json` - Remove Parcel-specific config
- `packages/audio-worklet-runtime/package.json` - Add main/types/exports
- `packages/web-worker-*/*/package.json` - Add missing fields
- `packages/editor/package.json` - Ensure consistency
- `packages/compiler-worker/package.json` - Standardize configuration

## Risks & Considerations

- **Risk 1**: Adding `"type": "module"` may break CommonJS imports
  - Mitigation: Ensure all packages use ES module syntax
- **Risk 2**: Removing Parcel configurations may break current builds
  - Mitigation: Test each change incrementally
- **Risk 3**: Changes to exports field may break import resolution
  - Mitigation: Test imports thoroughly after each change
- **Dependencies**: Should be done after TypeScript config updates
- **Breaking Changes**: Medium risk - may require code updates

## Related Items

- **Depends on**: TypeScript configuration updates (008-adjust-typescript-configuration.md)
- **Blocks**: Vite migration (001-vite-migration.md)
- **Related**: General project cleanup, build system standardization

## References

- [Node.js package.json exports field](https://nodejs.org/api/packages.html#exports)
- [ES modules in Node.js](https://nodejs.org/api/esm.html)
- [Vite package.json requirements](https://vitejs.dev/guide/build.html#library-mode)

## Notes

- This standardization will make Vite migration much smoother
- Consider creating a script to validate package.json consistency
- May need to update some import statements after adding exports field
- The `"sideEffects": false"` will help with tree-shaking in Vite
- Standardizing on ES modules now will prevent future CommonJS/ESM conflicts 

## Completion Summary

**Completed**: 2025-08-25

All package.json files have been successfully standardized with the following changes:

1. ✅ **Added ES module support**: All packages now include `"type": "module"`
2. ✅ **Added exports field**: Proper module resolution for all packages
3. ✅ **Added sideEffects**: Set to `false` for tree-shaking optimization
4. ✅ **Standardized descriptions**: Added meaningful descriptions to all packages
5. ✅ **Removed Parcel configurations**: Eliminated `targets` config from audio-worklet-runtime
6. ✅ **Standardized build scripts**: All packages now use TypeScript compiler consistently
7. ✅ **Added missing fields**: Repository field added to editor package
8. ✅ **Cleaned up**: Removed empty devDependencies objects

The monorepo is now ready for Vite migration with consistent, modern package.json configurations across all 8 packages.