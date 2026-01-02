---
title: 'TODO: Add Background Effects'
priority: Medium
effort: 2-4d
created: 2026-01-02
status: Open
completed: null
---

# TODO: Add Background Effects

## Problem Description

The editor currently supports post-process effects, but there is no mechanism to apply visual effects only to the editor background. This limits visual experimentation and makes it harder to separate UI readability from stylistic background treatments.

## Proposed Solution

Introduce `backgroundEffects` analogous to `postProcessEffects`, but restricted to the background layer in the editor. This should:
- Be defined alongside existing effect configuration and follow the same effect structure.
- Apply only to the background render pass.
- Leave code block rendering and UI overlays unaffected.
Shader blocks for background effects will use dedicated markers: `backgroundVertexShader` / `backgroundFragmentShader`.

Alternative: repurpose post-process effects with a flag for scope, but this risks cross-layer complexity and accidental UI impact.

## Implementation Plan

### Step 1: Define background effects data model and shader block scoping
- Add a new `backgroundEffects` field in state and project types.
- Extend block type detection to recognize `backgroundVertexShader` / `backgroundVertexShaderEnd` and
  `backgroundFragmentShader` / `backgroundFragmentShaderEnd`.
- Add background shader ID extractors mirroring the existing shader helpers.
- Add tests for block type detection and effect derivation for background vs foreground.

### Step 2: Rendering integration
- Split rendering into two passes: background-only to texture with background effects, then foreground/UI directly to canvas.
- Keep existing post-process effects behavior for the full-scene path unless explicitly replaced.
- Update the WebGL renderer/engine to support a background-only post-process pipeline.

### Step 3: Editor configuration and serialization
- Support loading/saving background effects in project data (if not derived).
- Add tests covering effect extraction, loading, and rendering behavior.

## Success Criteria

- [ ] Background effects render without impacting code blocks or overlays.
- [ ] Projects persist background effects across save/load (if persisted).
- [ ] Post-process effects continue to behave as before.
- [ ] Tests validate effect scoping and serialization.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - Add background effects types/state.
- `packages/editor/packages/editor-state/src/pureHelpers/shaderEffects/derivePostProcessEffects.ts` - Consider shared helpers or parallel logic.
- `packages/editor/packages/editor-state/src/pureHelpers/shaderUtils/getBlockType.ts` - Extend for background shader blocks.
- `packages/editor/packages/editor-state/src/pureHelpers/shaderUtils/getBackgroundVertexShaderId.ts` - Add.
- `packages/editor/packages/editor-state/src/pureHelpers/shaderUtils/getBackgroundFragmentShaderId.ts` - Add.
- `packages/editor/packages/web-ui/src/drawers/drawBackground.ts` - Apply background-only effects.
- `packages/editor/packages/web-ui/src/index.ts` - Split rendering passes.
- `packages/editor/packages/glugglug/src/engine.ts` - Add background-only post-process pathway.
- `packages/editor/packages/glugglug/src/renderer.ts` - Add separate render-to-texture for background.
- `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeToProject.ts` - Persist background effects.
- `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeToRuntimeReadyProject.ts` - Persist background effects for runtime-ready exports.

## Risks & Considerations

- **Layer separation**: Current renderer applies post-processing to the full scene; background-only effects require a new render pass.
- **Performance**: Background effects should not add significant cost to the main render loop.
- **Compatibility**: Existing post-process effects should remain unaffected.
- **Design clarity**: Background shader blocks must be clearly named in menus to avoid confusion with foreground effects.

## Related Items

- **Related**: `docs/todos/156-add-glsl-shader-code-blocks.md`
- **Related**: `docs/todos/157-add-comment-code-blocks.md`

## References

- `packages/editor/packages/web-ui/src/drawers/drawBackground.ts`
- `packages/editor/packages/editor-state/src/effects/shaders/shaderEffectsDeriver.ts`

## Notes

- Background effects are derived from `backgroundVertexShader` / `backgroundFragmentShader` blocks.
