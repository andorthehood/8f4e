# TODO: Remove browserslist from the project

**Priority**: 🟡  
**Estimated Effort**: 1-2 hours  
**Created**: 2024-12-19  
**Status**: Open  

## Problem Description

The project currently has a `browserslist` configuration in the root `package.json` that targets only Chrome:
```json
"browserslist": [
    "last 1 Chrome version"
]
```

This configuration is problematic because:
- It's very restrictive and only targets Chrome, limiting potential users
- It's not being actively used by the current Parcel build system
- It will conflict with Vite's default browser targeting when migrating
- Vite has its own modern browser targeting that's more appropriate for the project

## Proposed Solution

Remove the `browserslist` configuration entirely and let Vite handle browser targeting with its defaults, or configure it explicitly in Vite config if needed.

## Implementation Plan

### Step 1: Remove browserslist from package.json
- Remove the `"browserslist"` field from root `package.json`
- Verify no build scripts depend on browserslist
- Expected outcome: Clean package.json without browserslist

### Step 2: Check for browserslist dependencies
- Search for any `browserslist` or `browserslist-*` packages in dependencies
- Remove if found and not needed
- Expected outcome: No unused browserslist-related dependencies

### Step 3: Test build process
- Run `npm run build` to ensure removal doesn't break anything
- Verify the build still works correctly
- Expected outcome: Build process continues to work

## Success Criteria

- [ ] `browserslist` field removed from `package.json`
- [ ] No browserslist-related dependencies remain
- [ ] Build process continues to work
- [ ] Ready for Vite migration without browserslist conflicts

## Affected Components

- `package.json` - Remove browserslist field
- Build scripts - Verify they don't depend on browserslist
- Dependencies - Remove any browserslist-related packages

## Risks & Considerations

- **Risk 1**: Build process might depend on browserslist in ways not immediately obvious
  - Mitigation: Test build thoroughly after removal
- **Risk 2**: Some tools might expect browserslist configuration
  - Mitigation: Check if any development tools require it
- **Dependencies**: This should be done before Vite migration
- **Breaking Changes**: Minimal risk, mostly cleanup

## Related Items

- **Depends on**: None
- **Blocks**: Vite migration (001-vite-migration.md)
- **Related**: General project cleanup

## References

- [Vite browser targeting documentation](https://vitejs.dev/config/build-options.html#build-target)
- [Browserslist documentation](https://github.com/browserslist/browserslist)

## Notes

- This is a low-risk cleanup task that will make Vite migration smoother
- Vite defaults to targeting modern browsers, which is more appropriate for this project
- If specific browser support is needed later, it can be configured in Vite config instead 