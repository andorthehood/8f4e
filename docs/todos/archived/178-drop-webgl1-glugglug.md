---
title: 'TODO: Drop WebGL1 and move glugglug to WebGL2-only'
priority: Medium
effort: 2-4d
created: 2026-01-15
status: Completed
completed: 2026-01-16
---

# TODO: Drop WebGL1 and move glugglug to WebGL2-only

## Problem Description

glugglug currently targets WebGL1, which blocks modern rendering features (MRT, WebGL2 texture formats) and adds compatibility overhead. The project no longer needs legacy browser support, so keeping WebGL1 slows down new rendering capabilities like generic auxiliary buffers and feedback effects.

## Proposed Solution

Move the renderer to WebGL2-only by:
- Requesting `webgl2` context and removing WebGL1 code entirely
- Converting all shaders to GLSL ES 3.00 (`#version 300 es`, `in/out`, `texture()`)
- Updating texture/FBO setup to WebGL2 APIs and internal formats
- Adjusting attribute bindings as needed (optionally adopting VAOs)
- Deferring MRT/aux buffer work to a separate task

## Implementation Plan

### Step 1: Remove WebGL1 support
- Identify and delete WebGL1-only code paths and extensions
- Update context creation to `webgl2` only
- Remove WebGL1 fallback shader paths entirely

### Step 2: Update shader sources
- Convert sprite and post-process shaders to GLSL ES 3.00
- Replace `attribute/varying` with `in/out`
- Replace `texture2D` with `texture`

### Step 3: Update renderer bindings and resources
- Replace WebGL1 types with `WebGL2RenderingContext`
- Update texture creation to WebGL2 internal formats
- Update framebuffer creation and validation
- Decide whether to introduce VAOs for attribute state

### Step 4: Validation and documentation
- Manual smoke test: sprite rendering, post-process effects, resize
- Update docs to note WebGL2-only requirement
- Add a clear runtime error if WebGL2 is unavailable

## Success Criteria

- [ ] Renderer initializes using WebGL2 without fallback
- [ ] Sprite rendering and post-process effects work as before
- [ ] All shaders compile under GLSL ES 3.00
- [ ] Documentation updated to state WebGL2 requirement

## Affected Components

- `packages/editor/packages/glugglug/src/renderer.ts` - context creation, buffers, FBOs
- `packages/editor/packages/glugglug/src/postProcess/PostProcessManager.ts` - shader usage, uniforms
- `packages/editor/packages/glugglug/src/shaders/*` - shader sources
- `docs/` - update compatibility notes

## Risks & Considerations

- **Shader churn**: GLSL ES 3.00 changes can introduce compile errors
- **FBO differences**: stricter completeness rules may surface latent issues
- **Performance**: new pipeline may behave differently on mobile GPUs

## Related Items

- **Related**: `docs/brainstorming_notes/025-post-process-feedback-buffer.md`
- **Related**: `docs/todos/158-add-background-effects.md`

## References

- [WebGL2 specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [GLSL ES 3.00 reference](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)

## Notes

- This migration enables future MRT-based workflows but does not require MRT immediately.
