---
title: 'TODO: Decouple syntax highlighting for GLSL blocks'
priority: Medium
effort: 2-4h
created: 2026-01-12
status: Open
completed: null
---

# TODO: Decouple syntax highlighting for GLSL blocks

## Problem Description

All code blocks currently share the same syntax highlighting logic. This makes it difficult to support GLSL-specific syntax
for `vertexShader` and `fragmentShader` blocks without affecting the 8f4e language highlighting used elsewhere.

## Proposed Solution

Refactor the current 8f4e highlighter into a clearly named helper, add a minimal GLSL highlighter, and branch in the
code-block rendering pipeline based on block type.

- Rename `generateCodeColorMap` to `highlightSyntax8f4e` and move `instructionsToHighlight` inside the helper.
- Add `highlightSyntaxGlsl` that returns the same color-map structure with minimal GLSL rules.
- Route `vertexShader`/`fragmentShader` blocks to the GLSL highlighter; keep all other blocks on 8f4e highlighting.

### Minimal GLSL Highlighting Rules

- Keywords: `if`, `else`, `for`, `while`, `return`, `break`, `continue`, `discard`
- Types: `void`, `bool`, `int`, `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, `mat4`, `sampler2D`, `samplerCube`
- Comments: `//` line comments, `/* */` block comments
- Numbers: decimal, floats, hex
- Preprocessor lines (`#...`): highlight using the instruction color

## Implementation Plan

### Step 1: Rename the 8f4e highlighter
- Update `generateCodeColorMap` export name to `highlightSyntax8f4e`.
- Move `instructionsToHighlight` into `highlightSyntax8f4e`.
- Update imports/usages in the editor-state pipeline and tests.

### Step 2: Add the GLSL highlighter helper
- Implement `highlightSyntaxGlsl` in editor-state helpers with minimal token rules.
- Reuse existing sprite lookup roles (instruction/code/comment/number/binary) to keep rendering stable.

### Step 3: Branch by block type in rendering
- In `graphicHelper`, choose `highlightSyntaxGlsl` when `blockType` is `vertexShader` or `fragmentShader`.
- Keep all other block types on `highlightSyntax8f4e`.

## Success Criteria

- [ ] `vertexShader` and `fragmentShader` blocks render with GLSL token coloring.
- [ ] Non-shader blocks render exactly as before.
- [ ] Unit tests (if added) cover minimal GLSL token detection and 8f4e highlighting behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/generateCodeColorMap.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/highlightSyntaxGlsl.ts` (new)
- `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/*` tests

## Risks & Considerations

- **Token collisions**: GLSL keywords could be highlighted in comments without proper comment stripping.
- **Preprocessor color choice**: Treating `#` lines as instruction color is intentional; consider comment color if too noisy.
- **Performance**: Regex-heavy tokenization should remain lightweight for large blocks.

## Related Items

- **Related**: TODO 156 (GLSL shader code blocks for post-process effects)
- **Related**: TODO 166 (default vertex shader for post-process effects)

## Notes

- Keep helpers pure and deterministic to preserve rendering cache behavior.
