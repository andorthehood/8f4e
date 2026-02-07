---
title: 'TODO: Simplify post-process pipeline to a single effect'
priority: Medium
effort: 1-2d
created: 2026-01-19
status: Completed
completed: 2026-02-03
---

# TODO: Simplify post-process pipeline to a single effect

## Problem Description

The current post-process system supports chaining multiple effects. This adds complexity (intermediate targets, effect ordering) and makes MRT integration heavier than necessary. The project only needs a single post-process pass with MRT outputs.

## Proposed Solution

Remove support for multiple post-process effects and allow only one active effect at a time. The render pipeline should:
- Render the scene into `renderTexture`
- Run one post-process pass
- Output the main color to the screen

Shader blocks should also drop ID arguments:
- `vertexShader` ... `vertexShaderEnd`
- `fragmentShader` ... `fragmentShaderEnd`
- Use the first fragment block; use the first vertex block if present, otherwise inject the default vertex shader.

## Implementation Plan

### Step 1: Simplify effect data structures
- Replace effect lists with a single active effect in renderer/post-process manager
- Update effect loading and toggles to handle one effect

### Step 2: Update post-process rendering
- Remove chaining logic and intermediate render targets
- Render a single post-process pass to the screen

### Step 3: Update API usage and docs
- Adjust public APIs to set/replace the single effect
- Update README and example usage to show single-effect setup
- Update shader block creation/parsing to remove IDs and follow first-block selection

## Success Criteria

- [ ] Post-process pipeline supports exactly one effect
- [ ] No intermediate post-process targets or effect ordering logic remain
- [ ] Shader blocks work without IDs using the first-block rule

## Affected Components

- `packages/editor/packages/glugglug/src/postProcess/PostProcessManager.ts` - effect tracking and rendering
- `packages/editor/packages/glugglug/src/renderer.ts` - post-process orchestration
- `packages/editor/packages/glugglug/README.md` - usage documentation
- `packages/editor/packages/editor-state/src/features/shader-effects/*` - shader block parsing/derivation
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/*` - shader block defaults

## Risks & Considerations

- **Breaking change**: existing multi-effect setups will no longer work
- **API changes**: update any consumer code expecting effect arrays
- **Breaking change**: shader block IDs are removed with no backward compatibility

## Related Items

- **Related**: `docs/brainstorming_notes/025-post-process-feedback-buffer.md`
- **Related**: `docs/todos/178-drop-webgl1-glugglug.md`

## Notes

- This intentionally reduces flexibility in favor of simpler MRT integration.
