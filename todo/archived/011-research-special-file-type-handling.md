# TODO: Research Vite Handling of Special File Types

**Priority**: 🔴  
**Estimated Effort**: 6-8 hours  
**Created**: 2024-12-19  
**Status**: ✅ Completed  

## Problem Description

The project uses several special file types and technologies that require special handling in Vite, unlike the current Parcel setup. These need to be researched and solutions implemented before migration. **The main goal of this research is to update `todo/001-vite-migration.md` with a concrete, actionable migration plan based on the findings.**

## 📋 RESEARCH SUMMARY

**✅ Research Complete - Key Findings:**

### GLSL Shader Solutions
- **Recommended**: `vite-plugin-glsl` - Most mature plugin with 379+ stars
- **Alternative**: `vite-plugin-glslify` - Direct glslify replacement
- **Simple option**: Current template string pattern works without plugins
- **Migration**: Current shader files can remain unchanged

### AudioWorklet Solutions  
- **Solution**: `vite-plugin-worklet` - Direct replacement for `@parcel/transformer-worklet`
- **Migration**: Change `worklet:` imports to `?worklet` query parameter
- **Code change needed**: 1 import statement in `audioWorkletRuntime.ts`

### WebAssembly Compatibility
- **Status**: ✅ Fully compatible out-of-the-box
- **Migration**: No changes needed - current `WebAssembly.instantiate()` works directly
- **Dependencies**: `wabt` remains compatible

**📄 Migration Plan Added**: Detailed steps added to `todo/001-vite-migration.md`

---

## Original Problem Analysis

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
- `packages/editor/packages/glugglug/src/shaders/*.ts` - GLSL shaders
- `packages/audio-worklet-runtime/src/*.ts` - AudioWorklet code
- `packages/web-worker-*/*/src/*.ts` - WebAssembly usage
- `packages/compiler/src/wasmUtils/*.ts` - WASM compilation tools

## Proposed Solution

Research Vite-compatible solutions for each special file type and document the findings in a concrete migration plan that will be added to `todo/001-vite-migration.md`.

## Implementation Plan

### Step 1: Research GLSL shader handling in Vite ✅ COMPLETED
- ✅ Investigated Vite plugins for GLSL processing
- ✅ Compared with current `glslify-bundle` and `glslify-deps` functionality
- ✅ Found optimal solutions for current shader patterns
- **Outcome**: Identified `vite-plugin-glsl` as the best replacement for current GLSL handling

**Findings:**
- **Primary solution: `vite-plugin-glsl`** - Most mature and feature-complete
- **Alternative: `vite-plugin-glslify`** - Direct replacement for glslify functionality
- **Simple solution**: Template strings already work in Vite without plugins

### Step 2: Research WebAssembly handling in Vite ✅ COMPLETED
- ✅ Studied Vite's built-in WASM support and limitations
- ✅ Verified current `WebAssembly.instantiate()` patterns compatibility
- ✅ Confirmed `wabt` dependency compatibility
- **Outcome**: Current WASM usage patterns are fully compatible with Vite

**Findings:**
- Vite has built-in WebAssembly support
- Current `WebAssembly.instantiate()` patterns will work unchanged
- `wabt` dependency is compatible with Vite
- No plugins or configuration changes required

### Step 3: Research AudioWorklet alternatives for Vite ✅ COMPLETED
- ✅ Investigated Vite plugins for AudioWorklet processing
- ✅ Found replacement for `@parcel/transformer-worklet`
- ✅ Identified solution for `worklet:` import protocol
- **Outcome**: Found `vite-plugin-worklet` as direct replacement

**Findings:**
- **Primary solution: `vite-plugin-worklet`** - Direct replacement for Parcel's worklet transformer
- Supports TypeScript and provides proper URL handling
- Uses query parameter syntax: `?worklet` instead of `worklet:` protocol

### Step 4: Create migration plan ✅ COMPLETED
- ✅ Documented required Vite plugins and configurations for each file type
- ✅ Planned dependency updates and removals
- ✅ Identified any code changes needed
- ✅ **Updated `todo/001-vite-migration.md` with concrete migration steps based on research findings**
- **Expected outcome**: Complete migration plan added to vite-migration.md

## Success Criteria

- [x] Vite GLSL shader handling requirements researched and documented
- [x] Vite WASM handling requirements researched and documented
- [x] Vite AudioWorklet handling requirements researched and documented
- [x] **`todo/001-vite-migration.md` updated with concrete migration plan based on research findings**

## Affected Components

- **GLSL Shaders**: `packages/editor/packages/glugglug/src/shaders/*.ts`
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

## 🔬 DETAILED RESEARCH FINDINGS

### GLSL Shader Plugins Evaluated

**1. vite-plugin-glsl (Primary Recommendation)**
- **Stars**: 379+ | **Maintainer**: UstymUkhman
- **Features**: Import, inline, minify GLSL/WGSL files with `#include` support
- **Usage**: `import fragmentShader from './shader.frag'`
- **Config**: Supports minification, hot reload, duplicate import warnings
- **Compatibility**: Works with Three.js, Babylon.js, supports TypeScript

**2. vite-plugin-glslify (Alternative)**
- **Stars**: 37+ | **Maintainer**: KusStar  
- **Features**: Direct glslify compilation within Vite
- **Usage**: `glsl\`shader code\`` or import `.glsl` files
- **Benefits**: Maintains existing glslify ecosystem compatibility

**3. unplugin-glsl**
- **Stars**: 7+ | **Maintainer**: YunYouJun
- **Features**: Cross-bundler GLSL support (Vite, Webpack, Rollup)
- **Status**: Newer, smaller community

### AudioWorklet Plugin Evaluated

**vite-plugin-worklet (Selected Solution)**
- **Maintainer**: phoebe-cheng
- **Features**: Zero-config worklet support for Vite
- **Usage**: `import workletUrl from './audio.worklet.ts?worklet'`
- **TypeScript**: Full support with type declarations
- **Compatibility**: Supports Audio Worklet, Paint Worklet, other worklet types

### WebAssembly Research

**Vite Built-in Support**:
- Native WASM support since Vite 2.0
- `WebAssembly.instantiate()` works directly
- `.wasm` files can be imported as URLs
- No additional plugins required
- All current patterns remain functional

### Migration Complexity Assessment

**Low Risk**:
- WebAssembly: Zero changes needed
- GLSL shaders: Template string exports work as-is

**Medium Risk**:
- AudioWorklet: Single import change required
- Plugin configuration: Standard Vite setup

**Dependencies to Remove**:
- `@parcel/transformer-worklet`: 2.15.4 → vite-plugin-worklet
- `glslify-bundle`: 5.1.1 → vite-plugin-glsl (optional)
- `glslify-deps`: 1.3.2 → vite-plugin-glsl (optional)

## Original Notes

- This research is critical for successful Vite migration
- Some solutions may require custom Vite plugins
- Consider performance implications of different approaches
- May need to update import/export patterns for special files
- Test thoroughly in development before committing to solutions
- Keep fallback options in mind in case preferred solutions don't work 