---
title: Agent Failure Note - Symptom patch before root cause analysis
agent: Codex App Version 26.422.21637 (2056)
model: GPT-5.5 (High)
date: 2026-04-24
---

# Agent Failure Note - Symptom patch before root cause analysis

## Short Summary

The agent applied a local patch around `@home` viewport positioning before fully investigating the underlying font and grid initialization lifecycle. The change treated the visible symptom in `graphicHelper` instead of first locating the subsystem that owned the incorrect default grid state.

## Original Problem

When a project used a font smaller than the default 8x16 font, the initial `@home` code block positioning was off. The likely cause was that `@home` centering happened before the configured font was loaded, so the viewport calculation used the default 8x16 grid instead of the final 6x12 grid.

The first implementation added compensating logic to the `graphicHelper` effect. That was the convenient location because it had access to code blocks, viewport state, and sprite rerender events. But that convenience was itself a warning sign: `graphicHelper` was already carrying too much responsibility, and adding another repair path there made the component more god-like.

## Anti-Patterns

- Fixing the visible `@home` centering error where it appeared instead of tracing why the wrong grid existed at that time.
- Adding another helper to a high-responsibility effect because it had the data needed for a patch.
- Treating sprite rerendering as an opportunity to repair state after the fact.
- Letting a default 8x16 grid silently stand in for "font/grid not loaded yet."
- Moving forward with code before making the invalid startup state explicit.

```ts
// wrong direction: repairing a symptom from graphicHelper
function centerViewportOnSelectedCodeBlock() {
	const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;
	if (!selectedCodeBlock) {
		return;
	}

	const { x, y } = centerViewportOnCodeBlock(state.viewport, selectedCodeBlock, {
		alignment: selectedCodeBlock.homeAlignment,
	});
	updateViewport(state, x, y, events);
}
```

This kind of patch can make the symptom disappear while leaving the lifecycle unclear: when is the font loaded, when is the grid valid, and which subsystem is allowed to act before that is true?

## Failure Pattern

Patching the feature that visibly misbehaves before proving which initialization boundary made the bad state possible.

## Correct Solution

The correct first step should have been to inspect and model the font/grid lifecycle:

1. identify when the default font is loaded
2. identify when a project directive overrides that font
3. make "font/grid not ready yet" explicit instead of representing it as a valid 8x16 default
4. ensure viewport positioning only runs once the final grid is known
5. avoid adding repair logic to `graphicHelper` unless that subsystem truly owns the invariant

In this session, the accepted pragmatic direction was to make `@home` select the home block and recenter the selected block when the font/grid changes. That can be a reasonable product behavior, but it should not obscure the original engineering lesson: do not start by patching symptoms in a god component when the suspected root cause is an initialization and ownership problem.
