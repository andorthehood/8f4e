# Shader Effects Feature

## Purpose

Derives post-process visual effects from shader code blocks for display in the editor. Extracts vertex and fragment shaders from code blocks to create effect descriptors for algorave-style visual overlays.

## Key Behaviors

- **Effect Derivation**: Scans code blocks for `vertexShader` and `fragmentShader` types
- **Shader Extraction**: Extracts GLSL source code from shader blocks
- **Effect Descriptors**: Creates post-process effect objects for the rendering pipeline
- **Editor Overlays**: Powers visual effects displayed in the editor (not runtime output)
- **Error Surfacing**: Shader compilation errors are surfaced alongside code compilation errors

## Shader Block Types

- **`vertexShader`**: GLSL vertex shader code blocks
- **`fragmentShader`**: GLSL fragment shader code blocks

Blocks are automatically classified by content or explicit type annotation.

## Effect Generation

Post-process effects are generated from shader pairs:
- Each fragment shader can have an associated vertex shader
- Default vertex shader is used if none is specified
- Effects are identified by shader block IDs

## Events & Callbacks

### State Touched

- `state.graphicHelper.codeBlocks` - Source of shader blocks
- `state.postProcessEffects` - Derived array of effect descriptors (if stored)
- Shader compilation errors are added to error state

## Integration Points

- **Code Blocks**: Reads `vertexShader` and `fragmentShader` block types
- **Editor Rendering**: Effect descriptors feed into visual overlay system
- **Error Handling**: Shader errors are displayed like compilation errors
- **Project Export**: Effects are derived on-the-fly, not persisted in project files

## Use Case: Algorave Visuals

This feature enables live coding visuals for algorave performances:
- Write GLSL shaders as code blocks
- Effects automatically applied to editor view
- Real-time shader updates during performance
- Visual feedback synchronized with audio code

## Shader IDs

Utilities provide consistent ID generation:
- `getFragmentShaderId(blockId)` - ID for fragment shader effects
- `getVertexShaderId(blockId)` - ID for vertex shader effects

## Default Shaders

A default vertex shader is provided for fragment-only effects:
- Pass-through vertex shader for simple post-processing
- Defined in `defaultVertexShader.ts`

## References

- Shader extraction: `extractShaderSource.ts`
- Effect derivation: `derivePostProcessEffects.ts`
- Default shaders: `defaultVertexShader.ts`

## Notes & Limitations

- Effects are derived, not persisted in project serialization
- Shader errors may not map line numbers as precisely as code errors
- Effects are for editor display, not for runtime audio output visualization
- Shader compilation happens separately from WASM compilation
- GLSL version and capabilities depend on WebGL context
