---
title: 'TODO: Default Vertex Shader for Post-Process Effects'
priority: Medium
effort: 2-4h
created: 2026-01-12
status: Open
completed: null
---

# TODO: Default Vertex Shader for Post-Process Effects

## Problem Description

Post-process effects currently require both a vertex and fragment shader block. If a fragment shader is added without a matching vertex shader, the effect is rejected and an error is raised. This makes simple post-process effects more verbose and forces examples (like ripple) to include a boilerplate fullscreen-quad vertex shader.

## Proposed Solution

When a fragment shader is present without a matching vertex shader, use a default fullscreen-quad vertex shader (sourced from the ripple effect example). This makes fragment-only post-process effects valid without warnings or errors. Explicit vertex shader blocks remain unchanged, including empty blocks that can fail compilation naturally.

## Implementation Plan

### Step 1: Extract the default shader source
- Create a shared constant for the fullscreen-quad vertex shader.
- Use the vertex shader source currently in `src/examples/projects/rippleEffect.ts`.

### Step 2: Derive effects with defaults
- Update `derivePostProcessEffects` to pair fragment-only blocks with the default vertex shader.
- Remove the "no matching vertex shader" error for fragment-only blocks.

### Step 3: Update example and tests
- Remove the explicit vertex shader block from the ripple example project.
- Update `derivePostProcessEffects` tests to cover fragment-only success and default shader selection.

## Success Criteria

- [ ] Fragment-only post-process shaders compile using the default vertex shader.
- [ ] No errors are produced for missing vertex shaders.
- [ ] Ripple example works without an explicit vertex shader block.
- [ ] Unit tests cover the new fragment-only behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/pureHelpers/shaderEffects/derivePostProcessEffects.ts` - default vertex shader injection
- `packages/editor/packages/editor-state/src/pureHelpers/shaderEffects/defaultVertexShader.ts` - shared shader source
- `src/examples/projects/rippleEffect.ts` - remove explicit vertex shader block
- `packages/editor/packages/editor-state/src/pureHelpers/shaderEffects/derivePostProcessEffects.ts` - update tests

## Risks & Considerations

- **Default shader drift**: Ensure the shared default matches runtime expectations for attributes/varyings.
- **Compilation failures**: Empty explicit vertex shader blocks should still fail compilation as before.
- **Dependencies**: None.
- **Breaking Changes**: None expected; behavior is more permissive.

## Related Items

- **Related**: `docs/todos/156-add-glsl-shader-code-blocks.md`

## References

- `src/examples/projects/rippleEffect.ts`
- `packages/editor/packages/glugglug/src/postProcess/PostProcessManager.ts`

## Notes

- Decision: use the ripple effect vertex shader as the default fullscreen-quad shader.
