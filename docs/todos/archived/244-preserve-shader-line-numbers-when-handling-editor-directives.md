---
title: 'TODO: Preserve Shader Line Numbers When Handling Editor Directives'
priority: Medium
effort: 2-4h
created: 2026-02-18
status: Complete
completed: 2026-02-18
---

# 244: Preserve Shader Line Numbers When Handling Editor Directives

## Problem

Shader code blocks now contain editor directives such as:

```txt
; @pos <x> <y>
```

These lines break GLSL compilation if passed through unchanged.  
We do **not** want to strip lines entirely, because that shifts compiler error line numbers and makes editor diagnostics inaccurate.

## Goal

Make shader compilation resilient to editor directives while keeping 1:1 line mapping between editor code and compiled shader source.

## Proposed Fix

Add preprocessing in shader source extraction:

- File: `packages/editor/packages/editor-state/src/features/shader-effects/extractShaderSource.ts`
- After extracting lines between shader markers, transform per line:
  - If line matches editor directive (e.g. `^\s*;\s*@\w+`), replace with empty string `''`
  - Otherwise keep line unchanged
- Join transformed lines with `\n`

This preserves line count and line indices while neutralizing directive syntax for GLSL.

## Scope Notes

- Apply only to shader extraction/compilation input.
- Do not mutate persisted block `code`.
- Keep behavior identical for non-directive lines.

## Tests

Add/extend tests in `extractShaderSource.ts`:

- Directive lines are replaced with blank lines.
- Output line count equals original extracted line count.
- Non-directive lines remain unchanged.
- Marker discovery behavior remains unchanged.

## Acceptance Criteria

- Shader blocks with `; @pos` compile without syntax errors caused by directives.
- GLSL compiler error line numbers still align with lines shown in editor blocks.
