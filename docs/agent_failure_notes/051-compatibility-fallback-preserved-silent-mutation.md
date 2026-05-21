---
title: Agent Failure Note – Compatibility Fallback Preserved Silent Mutation
agent: Codex App Version 26.513.31313 (2867)
model: GPT-5.5 (high)
date: 2026-05-20
---

# Agent Failure Note – Compatibility Fallback Preserved Silent Mutation

## Short Summary

The agent fixed the selected-code-line subscription path, but initially kept a direct mutation fallback for non-selected blocks. That fallback preserved the same class of silent state change the fix was supposed to eliminate.

## Original Problem

The editor tracks the selected code line at `graphicHelper.selectedCodeBlock.cursor.row`. Internal consumers wanted to subscribe to changes with the state manager, but clicks on code lines did not notify subscribers because the click handler mutated the cursor directly:

```ts
codeBlock.cursor.row = boundedRow;
codeBlock.cursor.col = boundedCol;
```

The first fix correctly used `store.set(...)` for the normal selected-block path, but kept the direct mutation as a "compatibility fallback" when the clicked block was not the selected block.

## Anti-Patterns

- Keeping a compatibility fallback without identifying an actual compatibility requirement.
- Preserving old behavior when the old behavior is the failure mode.
- Treating an arbitrary event payload as a reason to keep silent mutation, instead of enforcing the state ownership boundary.
- Making the normal path observable while leaving a nearby exceptional path unobservable.

```ts
// wrong direction
if (codeBlock === state.graphicHelper.selectedCodeBlock) {
	store.set('graphicHelper.selectedCodeBlock.cursor', nextCursor);
	return;
}

codeBlock.cursor.row = boundedRow;
codeBlock.cursor.col = boundedCol;
```

This is wrong because it leaves an unobservable cursor update in the same interaction handler.

## Failure Pattern

Adding a defensive compatibility branch that preserves the bug class after the intended state boundary is already clear.

## Correct Solution

Cursor changes for the selected line should go through the state manager, and non-selected click payloads should not update cursor state silently.

```ts
if (codeBlock !== state.graphicHelper.selectedCodeBlock) {
	return;
}

store.set('graphicHelper.selectedCodeBlock.cursor', {
	...codeBlock.cursor,
	row: boundedRow,
	col: boundedCol,
});
```

When the purpose of a change is to make state observable, every write in that ownership path must use the observable state API. Compatibility fallbacks should only be added when there is a concrete caller contract to preserve, and that contract should be named in the code or summary.
