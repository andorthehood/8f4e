# TODO: Convert from Parcel to Vite Build System

**Priority**: 🔴  
**Estimated Effort**: 1-2 weeks  
**Created**: 2025-01-23  
**Status**: Open  

## Problem Description

The project currently uses Parcel 2.15.4 as its build system, but Vite offers several advantages:

- **Faster development builds**: ES modules + esbuild for rapid development
- **Better HMR**: More reliable hot module replacement
- **Modern tooling**: Better integration with TypeScript 5.x and modern dependencies
- **Ecosystem**: Larger plugin ecosystem and better community support
- **Performance**: Faster production builds with Rollup

Current build system issues:
- Complex multi-entry configuration with Parcel
- Custom header copying (`cp ./src/_headers ./dist/_headers`)
- Mixed build patterns across packages
- Some packages use Parcel, others use TypeScript directly

## Proposed Solution

Migrate the entire monorepo to use Vite with proper workspace support:

1. **Configure Vite for multi-page application** - Handle multiple HTML entry points
2. **Migrate package builds** - Consistent build system across all packages
3. **Asset handling** - Proper static asset management
4. **Development workflow** - Maintain or improve current dev experience

## Implementation Plan

### Step 1: Root Vite Configuration
- Install Vite and necessary plugins
- Configure multi-page setup for `editor.html` and `index.html`
- Set up asset handling for `_headers` and other static files
- Expected outcome: Basic Vite build working for main application

### Step 2: Package Build Migration
- Convert packages from TypeScript/Parcel builds to Vite library mode
- Update build scripts across all packages
- Ensure proper ESM output for modern consumption
- Expected outcome: All packages build consistently with Vite

### Step 3: Development Experience
- Configure dev server with proper proxy settings
- Ensure HMR works correctly for all entry points
- Test audio worklet and web worker builds
- Expected outcome: Development workflow equal or better than current

### Step 4: Production Optimization
- Configure production builds with proper chunking
- Ensure all special file types (WASM, worklets) are handled
- Verify cross-origin headers work correctly
- Expected outcome: Production builds work in all target environments

## Success Criteria

- [ ] `npm run dev` starts Vite dev server with working HMR
- [ ] `npm run build` produces working production builds
- [ ] All packages build successfully with Vite
- [ ] Audio worklets and web workers function correctly
- [ ] Cross-origin headers are properly configured
- [ ] Build performance is equal or better than Parcel
- [ ] No functionality regression in any environment

## Affected Components

- **Root configuration**: `package.json`, build scripts, dev server config
- **All packages**: Build scripts and output configuration
- **Asset handling**: `src/_headers`, static files, special file types
- **Development workflow**: HMR, proxy configuration, port management

## Risks & Considerations

- **Breaking changes**: Build output changes might affect deployment
- **Special file handling**: Audio worklets, web workers need careful migration
- **Cross-origin requirements**: Critical for AudioWorklet functionality
- **Development disruption**: Team needs to adapt to new tooling
- **Dependencies**: Should complete housekeeping tasks first

## Related Items

- **Depends on**: `003-standardize-build-scripts.md` - Should standardize before migration
- **Blocks**: Future modern tooling adoption and performance improvements
- **Related**: TypeScript configuration updates may be needed

## References

- [Vite Documentation](https://vitejs.dev/)
- [Vite Multi-Page Apps](https://vitejs.dev/guide/build.html#multi-page-app)
- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
- [AudioWorklet + Vite Integration](https://github.com/vitejs/vite/discussions/7720)

## Notes

- This is the primary goal after housekeeping tasks are complete
- Requires careful testing of audio functionality due to browser security requirements
- Consider creating a separate branch for migration work
- Plan for rollback strategy in case of critical issues during migration 