# TODO: Research Vite Handling of Special File Types

**Priority**: 🔴  
**Estimated Effort**: 6-8 hours  
**Created**: 2024-12-19  
**Status**: Open  

## Problem Description

The project uses several special file types and technologies that require special handling in Vite, unlike the current Parcel setup. These need to be researched and solutions implemented before migration:

**GLSL Shaders:**
- Currently using `glslify-bundle` and `glslify-deps` for shader processing
- Shaders are embedded as template strings in TypeScript files
- Need to find Vite-compatible alternatives for shader bundling and preprocessing

**WebAssembly (WASM):**
- Heavy use of `WebAssembly.instantiate()` throughout the codebase
- `wabt` dependency for WASM tooling
- Need to understand Vite's WASM handling and ensure compatibility
- WASM files may need special import handling

**AudioWorklet:**
- Currently using `@parcel/transformer-worklet` for AudioWorklet processing
- AudioWorklet code is dynamically loaded and instantiated
- Need Vite alternatives for AudioWorklet transformation and loading

**Current problematic dependencies:**
```json
// Root package.json
"@parcel/transformer-worklet": "^2.15.4",  // Won't work with Vite
"glslify-bundle": "5.1.1",                 // May not work with Vite
"glslify-deps": "1.3.2",                   // May not work with Vite
"wabt": "^1.0.29"                          // Need to verify Vite compatibility
```

**Files affected:**
- `packages/2d-engine/src/shaders/*.ts` - GLSL shaders
- `packages/audio-worklet-runtime/src/*.ts` - AudioWorklet code
- `packages/web-worker-*/*/src/*.ts` - WebAssembly usage
- `packages/compiler/src/wasmUtils/*.ts` - WASM compilation tools

## Proposed Solution

Research and implement Vite-compatible solutions for each special file type:

1. **Research Vite plugins** for GLSL shader handling
2. **Investigate Vite's WASM support** and update usage patterns
3. **Find AudioWorklet alternatives** that work with Vite
4. **Test all solutions** to ensure they work correctly
5. **Document migration steps** for each file type

## Implementation Plan

### Step 1: Research GLSL shader handling in Vite
- Investigate Vite plugins for GLSL processing (e.g., `vite-plugin-glsl`, `vite-plugin-glslify`)
- Compare with current `glslify-bundle` and `glslify-deps` functionality
- Test shader import/export patterns with Vite
- Expected outcome: Identified Vite plugin(s) for GLSL handling

### Step 2: Research WebAssembly handling in Vite
- Study Vite's built-in WASM support and limitations
- Research Vite plugins for enhanced WASM handling if needed
- Test current `WebAssembly.instantiate()` patterns with Vite
- Verify `wabt` dependency compatibility
- Expected outcome: Understanding of WASM handling requirements in Vite

### Step 3: Research AudioWorklet alternatives for Vite
- Investigate Vite plugins for AudioWorklet processing
- Research alternatives to `@parcel/transformer-worklet`
- Test AudioWorklet loading and instantiation with Vite
- Expected outcome: Identified Vite-compatible AudioWorklet solution

### Step 4: Test solutions with sample files
- Create test cases for each file type
- Verify that shaders compile and load correctly
- Test WASM instantiation works as expected
- Verify AudioWorklet functionality is preserved
- Expected outcome: Working proof-of-concept for each file type

### Step 5: Plan migration strategy
- Document required Vite plugins and configurations
- Plan dependency updates and removals
- Identify any code changes needed
- Create migration checklist for each file type
- Expected outcome: Complete migration plan for special file types

### Step 6: Update project documentation
- Document Vite-specific requirements for each file type
- Update development guidelines for working with special files
- Create troubleshooting guide for common issues
- Expected outcome: Comprehensive documentation for developers

## Success Criteria

- [ ] Vite-compatible GLSL shader handling solution identified and tested
- [ ] Vite WASM handling requirements understood and documented
- [ ] Vite-compatible AudioWorklet solution identified and tested
- [ ] All special file types work correctly with Vite
- [ ] Migration plan documented with specific steps
- [ ] Dependencies updated to remove Parcel-specific packages
- [ ] Development documentation updated for Vite workflow

## Affected Components

- **GLSL Shaders**: `packages/2d-engine/src/shaders/*.ts`
- **AudioWorklet**: `packages/audio-worklet-runtime/src/*.ts`
- **WebAssembly**: All packages using `WebAssembly.instantiate()`
- **Dependencies**: Root and package-level package.json files
- **Build Configuration**: Vite config files (to be created)
- **Documentation**: Development guides and migration docs

## Risks & Considerations

- **Risk 1**: Vite may not have equivalent functionality for some Parcel features
  - Mitigation: Research alternatives, consider custom plugins if needed
- **Risk 2**: Some file types may require significant code changes
  - Mitigation: Test thoroughly, plan incremental migration
- **Risk 3**: Performance characteristics may differ between Parcel and Vite
  - Mitigation: Benchmark critical operations, optimize if needed
- **Dependencies**: Should be done before full Vite migration
- **Breaking Changes**: High risk - may require significant code updates

## Related Items

- **Depends on**: Package.json standardization (009-standardize-package-json-fields.md)
- **Blocks**: Vite migration (001-vite-migration.md)
- **Related**: Import/export pattern audit (010-audit-import-export-patterns.md)

## References

- [Vite plugin ecosystem](https://vitejs.dev/plugins/)
- [Vite WebAssembly support](https://vitejs.dev/guide/features.html#webassembly)
- [Vite asset handling](https://vitejs.dev/guide/assets.html)
- [GLSL Vite plugins](https://github.com/topics/vite-plugin-glsl)
- [AudioWorklet in Vite](https://github.com/search?q=vite+audioworklet)

## Notes

- This research is critical for successful Vite migration
- Some solutions may require custom Vite plugins
- Consider performance implications of different approaches
- May need to update import/export patterns for special files
- Test thoroughly in development before committing to solutions
- Keep fallback options in mind in case preferred solutions don't work 