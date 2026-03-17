---
title: Agent Failure Note – Symptom-Hiding Patch Instead of Root-Cause Fix
agent: Codex
model: GPT-5
date: 2026-03-17
---

# Agent Failure Note – Symptom-Hiding Patch Instead of Root-Cause Fix

## Short Summary

The agent observed a visible failure in one feature path and started adding local compensating logic near that symptom. In this case the example was `@home` centering on browser reload. That reduced the surface problem but avoided the real question: which subsystem actually owns the state or lifecycle that made the failure possible.

## Original Problem

The concrete example was the `@home` directive: the block marked with `; @home` did not center on browser reload, but the manual `Go @home` action worked.

That pattern should have triggered a root-cause check:

- Is the failing path using the same state at the same time?
- Is the failing path running before required state is initialized?
- Is the bug really in the feature that looks broken, or in a lower-level lifecycle boundary?

Instead, the initial response was to patch behavior near the symptom, inside code-block loading and follow-up resize handling.

## Anti-Patterns

Adding conditional repair logic close to the visible failure:

```ts
const homeBlock = codeBlocks.find(block => block.isHome);
if (homeBlock) {
	store.set('graphicHelper.selectedCodeBlock', homeBlock);
	if (state.viewport.width > 0 && state.viewport.height > 0) {
		centerViewportOnCodeBlock(state.viewport, homeBlock);
	}
}
```

This is wrong when `applyLocalCorrection()` exists only to mask a deeper initialization, ownership, or sequencing bug.

In the `@home` case, the smell was that centering logic was being added outside the viewport lifecycle just to compensate for startup timing.

Other variants of the same mistake:

- duplicating logic in multiple paths so the symptom disappears in one scenario
- adding fallback behavior in a neighboring subsystem because it has convenient access to the data
- preserving an incorrect architecture by layering more state-sync logic on top of it

## Failure Pattern

Treating a symptom at the point of observation instead of tracing the failure back to the subsystem that actually owns the invariant.

## Correct Solution

The correct response is:

1. Identify the invariant that is being violated.
2. Find which subsystem owns that invariant.
3. Fix the timing, state flow, or boundary in that owning subsystem.
4. Remove compensating logic that only exists to hide the symptom.

For the `@home` example, that means:

- keep home-block discovery in the directive/code-block layer
- treat viewport readiness as a viewport concern
- perform startup centering only when viewport dimensions are valid

The key discipline is: do not stop at “where the bug is visible.” Keep going until you find where the bug becomes inevitable.
