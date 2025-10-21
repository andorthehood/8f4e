---
title: 'TODO: Adjust TypeScript Configuration for Vite Migration'
priority: �
effort: 3-4 hours
created: 2025-08-25
status: Completed
completed: null
---

# TODO: Adjust TypeScript Configuration for Vite Migration

## Problem Description

The current TypeScript configuration has several issues that will cause problems during Vite migration:

**Root tsconfig.json issues:**
- `"isolatedModules": false` - This should be `true` for Vite compatibility
- `"moduleResolution": "node"` - Should be `"bundler"` for Vite
- Missing modern ESM compatibility options

**Package-level tsconfig.json inconsistencies:**
- Some packages override `moduleResolution` back to `"node"`
- Inconsistent strict mode settings across packages
- Some packages have `"types": ["node"]` which may not be needed
- Path mapping in editor package uses relative paths that may not work with Vite

**Current problematic settings:**
```json
// Root tsconfig.json
{
  "isolatedModules": false,        // Should be true
  "moduleResolution": "node",      // Should be "bundler"
  "strict": false,                 // Should be true for better type safety
  "strictNullChecks": true,        // Inconsistent with strict: false
  "noImplicitAny": true           // Inconsistent with strict: false
}
```

## Proposed Solution

Standardize and modernize TypeScript configuration across all packages to be Vite-compatible:

1. **Update root tsconfig.json** with modern, Vite-compatible settings
2. **Standardize package-level configs** to extend root properly
3. **Remove conflicting overrides** that will cause Vite issues
4. **Add ESM compatibility options** for better module handling

## Implementation Plan

### Step 1: Update root tsconfig.json
- Change `"isolatedModules": true`
- Change `"moduleResolution": "bundler"`
- Set `"strict": true` and remove conflicting individual strict options
- Add `"allowImportingTsExtensions": false`
- Add `"verbatimModuleSyntax": true`
- Expected outcome: Modern, Vite-compatible root configuration

### Step 2: Clean up package-level tsconfig.json files
- Remove `"moduleResolution": "node"` overrides from packages
- Remove `"types": ["node"]` unless specifically needed
- Ensure all packages properly extend root config
- Standardize `"noEmit": false` and declaration settings
- Expected outcome: Consistent package configurations

### Step 3: Fix path mapping in editor package
- Review and update path mappings for Vite compatibility
- Consider using package names instead of relative paths
- Test that imports still resolve correctly
- Expected outcome: Working import resolution

### Step 4: Test configuration changes
- Run `npm run typecheck` across all packages
- Verify no new TypeScript errors introduced
- Test build process still works
- Expected outcome: Clean type checking and builds

## Success Criteria

- [ ] Root tsconfig.json uses modern, Vite-compatible settings
- [ ] All packages extend root config without conflicting overrides
- [ ] `npm run typecheck` passes across all packages
- [ ] Build process continues to work
- [ ] Configuration is ready for Vite migration

## Affected Components

- `tsconfig.json` - Root configuration modernization
- `packages/*/tsconfig.json` - Package-level configuration cleanup
- `packages/editor/tsconfig.json` - Path mapping updates
- All TypeScript files - May need import/export syntax updates

## Risks & Considerations

- **Risk 1**: Enabling strict mode may reveal existing type errors
  - Mitigation: Fix errors incrementally, don't enable all strict options at once
- **Risk 2**: Changing moduleResolution may break some imports
  - Mitigation: Test thoroughly and update import statements as needed
- **Risk 3**: Path mapping changes may break editor functionality
  - Mitigation: Test editor thoroughly after changes
- **Dependencies**: Should be done before Vite migration
- **Breaking Changes**: Medium risk - may require code changes

## Related Items

- **Depends on**: None
- **Blocks**: Vite migration (001-vite-migration.md)
- **Related**: General project cleanup, type safety improvements

## References

- [Vite TypeScript configuration](https://vitejs.dev/guide/typescript.html)
- [TypeScript moduleResolution options](https://www.typescriptlang.org/tsconfig#moduleResolution)
- [TypeScript strict mode options](https://www.typescriptlang.org/tsconfig#strict)

## Notes

- This is a critical prerequisite for Vite migration
- Consider enabling strict mode gradually to avoid overwhelming changes
- Test each configuration change incrementally
- May need to update some import/export statements after changes
- The `"bundler"` moduleResolution is specifically designed for modern bundlers like Vite 