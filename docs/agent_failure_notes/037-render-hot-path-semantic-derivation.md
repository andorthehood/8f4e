---
title: Agent Failure Note - Rendering hot path semantic derivation
agent: Codex App Version 26.422.21637 (2056)
model: GPT-5.5 (High)
date: 2026-04-24
---

# Agent Failure Note - Rendering hot path semantic derivation

## Short Summary

The agent suggested making UI copy accurate by calling presentation directive parsing from the mode overlay renderer. That put semantic derivation in a rendering hot path and crossed the ownership boundary between editor-state and web-ui.

## Original Problem

The UI hint in view mode said:

```ts
const VIEW_MODE_HINT = "You're in view mode, press e to edit or p to present";
```

Presentation mode immediately exits when there are no valid `@stop` directives, so the hint is misleading for projects without presentation stops. The user asked how to fix the hint.

The first proposed solution was to add a helper such as `hasPresentationStops(...)` and call it from `modeOverlay.ts` while drawing. Although it reused the canonical parser, it still meant the renderer would scan code blocks and parse directives just to decide text for a frame.

## Anti-Patterns

- Calling directive parsers from draw functions.
- Treating "reuse the existing parser" as sufficient without considering when and where it runs.
- Letting web-ui derive semantic editor capability from raw code-block metadata.
- Fixing a UI copy bug by moving domain logic into the renderer.
- Ignoring that rendering code should consume already-derived state whenever possible.

```ts
// wrong boundary: deriving semantic capability while drawing
const viewModeHint = hasPresentationStops(state.graphicHelper.codeBlocks)
	? VIEW_MODE_HINT_WITH_PRESENTATION
	: VIEW_MODE_HINT;
```

This is wrong because `modeOverlay.ts` is a renderer. It should not parse directives or compute presentation capability from code blocks during rendering.

## Failure Pattern

Moving semantic derivation into a rendering hot path because it is convenient for a UI condition.

## Correct Solution

Presentation availability should be derived by editor-state, in the same subsystem that owns presentation stops. The presentation effect already recomputes stops when code blocks change and when presentation mode is entered. It should update a cached boolean such as `state.presentation.canPresent` from that derived stop list.

The web-ui overlay should then read only that boolean:

```ts
const viewModeHint = state.presentation.canPresent ? VIEW_MODE_HINT_WITH_PRESENTATION : VIEW_MODE_HINT;
```

That keeps the boundaries clear:

- presentation parsing and stop derivation stay in editor-state
- web-ui only renders already-derived presentation state
- draw calls do not scan code blocks or parse directives
- malformed `@stop` directives follow the same validity rules as presentation mode itself
