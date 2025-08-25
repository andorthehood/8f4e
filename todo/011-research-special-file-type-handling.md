# TODO: Research Vite Handling of Special File Types

**Priority**: 🔴  
**Estimated Effort**: 6-8 hours  
**Created**: 2024-12-19  
**Status**: Open  

## Problem Description

The project uses several special file types and technologies that require special handling in Vite, unlike the current Parcel setup. These need to be researched and solutions implemented before migration. **The main goal of this research is to update `todo/001-vite-migration.md` with a concrete, actionable migration plan based on the findings.**

**GLSL Shaders:**

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

Research Vite-compatible solutions for each special file type and document the findings in a concrete migration plan that will be added to `todo/001-vite-migration.md`.

## Implementation Plan

### Step 1: Research GLSL shader handling in Vite
- Investigate Vite plugins for GLSL processing (e.g., `vite-plugin-glsl`, `vite-plugin-glslify`)
- Compare with current `glslify-bundle` and `glslify-deps` functionality
- Expected outcome: Understanding of Vite GLSL handling requirements

### Step 2: Research WebAssembly handling in Vite
- Study Vite's built-in WASM support and limitations
- Research Vite plugins for enhanced WASM handling if needed
- Expected outcome: Understanding of Vite WASM handling requirements

### Step 3: Research AudioWorklet alternatives for Vite
- Investigate Vite plugins for AudioWorklet processing
- Research alternatives to `@parcel/transformer-worklet`
- Expected outcome: Understanding of Vite AudioWorklet handling requirements

### Step 4: Create migration plan
- Document required Vite plugins and configurations for each file type
- Plan dependency updates and removals
- Identify any code changes needed
- **Update `todo/001-vite-migration.md` with concrete migration steps based on research findings**
- Expected outcome: Complete migration plan added to vite-migration.md

## Success Criteria

- [ ] Vite GLSL shader handling requirements researched and documented
- [ ] Vite WASM handling requirements researched and documented
- [ ] Vite AudioWorklet handling requirements researched and documented
- [ ] **`todo/001-vite-migration.md` updated with concrete migration plan based on research findings**

## Affected Components

- **GLSL Shaders**: `packages/2d-engine/src/shaders/*.ts`
- **AudioWorklet**: `packages/audio-worklet-runtime/src/*.ts`
- **WebAssembly**: All packages using `WebAssembly.instantiate()`
- **Dependencies**: Root and package-level package.json files
- **Documentation**: `todo/001-vite-migration.md` (to be updated with migration plan)

## Risks & Considerations

- **Risk 1**: Vite may not have equivalent functionality for some Parcel features
  - Mitigation: Research alternatives, consider custom plugins if needed
- **Risk 2**: Research may reveal significant migration challenges
  - Mitigation: Document all findings thoroughly, plan accordingly
- **Dependencies**: Should be done before full Vite migration
- **Scope**: This is research only - no implementation or testing required

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