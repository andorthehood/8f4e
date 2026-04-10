# Shader Effects Feature

## Purpose

Derives post-process visual effects from shader notes for display in the editor. Extracts vertex and fragment shaders from note blocks to create effect descriptors for algorave-style visual overlays.

## Key Behaviors

- **Effect Derivation**: Scans note blocks for recognized shader note subtypes
- **Shader Extraction**: Extracts GLSL source code from shader notes
- **Effect Descriptors**: Creates post-process effect objects for the rendering pipeline
- **Editor Overlays**: Powers visual effects displayed in the editor (not runtime output)
- **Error Surfacing**: Shader compilation errors are surfaced alongside code compilation errors

## Shader Note Types

- **`note vertexShaderPostprocess`** / **`note vertexShaderBackground`**: GLSL vertex shader notes
- **`note fragmentShaderPostprocess`** / **`note fragmentShaderBackground`**: GLSL fragment shader notes

Notes are automatically recognized by their header subtype.

## Effect Generation

A single post-process effect is derived from shader notes:
- The first fragment shader note (by creation order) is used as the effect
- The first vertex shader note is paired with it; if none exists, the default vertex shader is used
- Only one effect is active at a time

## Events & Callbacks

### State Touched

- `state.graphicHelper.codeBlocks` - Source of shader notes
- `state.postProcessEffects` - Derived array of effect descriptors (if stored)
- Shader compilation errors are added to error state

## Integration Points

- **Code Blocks**: Reads note headers to detect shader roles
- **Editor Rendering**: Effect descriptors feed into visual overlay system
- **Error Handling**: Shader errors are displayed like compilation errors
- **Project Export**: Effects are derived on-the-fly, not persisted in project files

## Use Case: Algorave Visuals

This feature enables live coding visuals for algorave performances:
- Write GLSL shaders as typed note blocks
- Effects automatically applied to editor view
- Real-time shader updates during performance
- Visual feedback synchronized with audio code

## Shader Note Format

Shader notes use `note ... noteEnd` with a typed subtype:
- `note vertexShaderPostprocess` ... `noteEnd`
- `note fragmentShaderPostprocess` ... `noteEnd`
- `note vertexShaderBackground` ... `noteEnd`
- `note fragmentShaderBackground` ... `noteEnd`

## Default Shaders

A default vertex shader is provided by `glugglug` for fragment-only effects:
- Pass-through fullscreen-quad shader for simple post-processing/background effects
- `deriveShaderEffects` leaves `vertexShader` undefined when no vertex shader note is present

## References

- Shader extraction: `extractShaderSource.ts`
- Effect derivation: `deriveShaderEffects.ts` (first-block selection per target)
- Runtime defaults: `glugglug` effect managers

## Notes & Limitations

- Effects are derived, not persisted in project serialization
- Shader errors map line numbers accurately due to blank-line preservation for editor directives
- Effects are for editor display, not for runtime audio output visualization
- Shader compilation happens separately from WASM compilation
- GLSL version and capabilities depend on WebGL context
- Editor directives (e.g., `; @pos`, `; @disabled`) are replaced with blank lines during extraction to prevent syntax errors while preserving line numbers
