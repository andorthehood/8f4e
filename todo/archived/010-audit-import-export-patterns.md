# TODO: Audit Import/Export Patterns for Vite Compatibility

**Priority**: 🟡  
**Estimated Effort**: 4-5 hours  
**Created**: 2025-08-25  
**Status**: Open  

## Problem Description

The project needs a comprehensive audit of import/export patterns to ensure Vite compatibility and identify potential issues during migration. While the codebase appears to use ES modules consistently, there are several areas that need attention:

**Current state analysis:**
- ✅ **Good**: No CommonJS patterns found (`require()`, `module.exports`)
- ✅ **Good**: Consistent use of ES module syntax (`import`/`export`)
- ✅ **Good**: Proper use of named and default exports
- ⚠️ **Mixed**: Some files use `export *` which can cause issues with Vite
- ⚠️ **Mixed**: Inconsistent export patterns across packages
- ⚠️ **Unknown**: Need to verify all import paths work with Vite's module resolution

**Specific concerns identified:**
```typescript
// packages/compiler/src/index.ts - problematic export pattern
export * from './types';  // This can cause issues with Vite

// packages/editor/src/index.ts - good pattern
export default async function init(...) { ... }

// packages/2d-engine/src/index.ts - good pattern
export type SpriteCoordinates = { ... };
export class Engine { ... }
```

**Areas requiring investigation:**
- Cross-package imports using relative paths
- Barrel exports and re-exports
- Dynamic imports and code splitting
- Asset imports (shaders, textures, etc.)
- Worker and AudioWorklet imports

## Proposed Solution

Conduct a systematic audit of all import/export patterns and fix any issues that could cause problems with Vite:

1. **Audit all import/export statements** across the codebase
2. **Identify problematic patterns** that won't work with Vite
3. **Fix export * patterns** by being more specific about what's exported
4. **Verify import path resolution** works with Vite's module system
5. **Test critical import paths** to ensure they resolve correctly

## Implementation Plan

### Step 1: Comprehensive import/export audit
- Scan all TypeScript files for import/export statements
- Document current patterns and identify inconsistencies
- Flag any patterns that might cause Vite issues
- Expected outcome: Complete inventory of import/export patterns

### Step 2: Fix problematic export * patterns
- Replace `export * from './types'` with specific named exports
- Ensure all re-exports are explicit and clear
- Test that functionality is preserved after changes
- Expected outcome: No more export * patterns in the codebase

### Step 3: Audit cross-package import paths
- Review all imports between packages
- Verify that relative paths will work with Vite
- Check for circular dependency issues
- Expected outcome: All cross-package imports are Vite-compatible

### Step 4: Test asset imports and special cases
- Verify shader file imports work correctly
- Check texture and image imports
- Test worker and AudioWorklet imports
- Expected outcome: All asset imports are properly handled

### Step 5: Validate import resolution
- Run `npm run typecheck` to catch any import errors
- Test build process to ensure imports resolve correctly
- Verify no runtime import errors occur
- Expected outcome: Clean builds with no import resolution issues

### Step 6: Document import/export standards
- Create guidelines for future import/export patterns
- Document any Vite-specific import requirements
- Update development guidelines
- Expected outcome: Clear standards for maintaining Vite compatibility

## Success Criteria

- [ ] All `export *` patterns replaced with specific exports
- [ ] All cross-package imports verified as Vite-compatible
- [ ] All asset imports (shaders, textures) work correctly
- [ ] No import resolution errors during build or runtime
- [ ] Import/export patterns documented and standardized
- [ ] Codebase ready for Vite migration without import issues

## Affected Components

- `packages/compiler/src/index.ts` - Fix export * from './types'
- All package index files - Review and standardize exports
- Cross-package import statements - Verify Vite compatibility
- Asset import statements - Ensure proper handling
- Worker and AudioWorklet imports - Test compatibility

## Risks & Considerations

- **Risk 1**: Replacing export * patterns may break existing imports
  - Mitigation: Test thoroughly after each change, update import statements as needed
- **Risk 2**: Some import paths may not work with Vite's module resolution
  - Mitigation: Test each problematic import path individually
- **Risk 3**: Asset imports may need different syntax in Vite
  - Mitigation: Research Vite's asset handling and update accordingly
- **Dependencies**: Should be done after package.json standardization
- **Breaking Changes**: Low risk - mostly cleanup and standardization

## Related Items

- **Depends on**: Package.json standardization (009-standardize-package-json-fields.md)
- **Blocks**: Vite migration (001-vite-migration.md)
- **Related**: TypeScript configuration updates (008-adjust-typescript-configuration.md)

## References

- [Vite import handling](https://vitejs.dev/guide/features.html#bare-module-resolving)
- [ES modules best practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Vite asset handling](https://vitejs.dev/guide/assets.html)

## Notes

- This audit will help identify any hidden import/export issues before Vite migration
- The `export *` pattern is particularly problematic as it can cause unexpected behavior in Vite
- Consider creating automated tests to verify import resolution works correctly
- Some import patterns may need to be updated to work with Vite's more strict module resolution
- This task will help establish consistent import/export patterns across the entire codebase 