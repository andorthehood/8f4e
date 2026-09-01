---
title: Agent Failure Note - Render prepass instead of memory-resolution fix
date: 2026-09-01
agent: Codex Version 26.818.61809
model: GPT-5.6 Sol (High)
---

# Agent Failure Note - Render prepass instead of memory-resolution fix

## Short Summary

The agent initially fixed a disappearing dereferenced `@watch` value by adding an output-registration prepass to code-block rendering. The prepass hid the render-order symptom, but preserved the actual defect: pointer resolution depended on renderer-owned output widgets instead of the compiler's memory model.

## Original Problem

`@watch *pointer` rendered correctly while its code block was selected or near the top of the z-order, then disappeared when another block moved ahead of it. Ordinary watches such as `@watch value` and address watches such as `@watch &value` were stable.

The difference exposed the real dependency:

- ordinary and address watches resolved declaration metadata directly from the compiler memory plan
- a dereferenced watch read the pointer's runtime address, then looked up the pointee through `codeBlockRendering.outputsByWordAddress`
- the renderer cleared and repopulated that output map while deriving blocks in z-order

Consequently, a dereferenced watch resolved only if the pointee's output widget had already been created during the current rendering pass. Selecting blocks changed their z-order and therefore changed whether the lookup succeeded.

The first attempted fix populated every block's outputs before deriving any block:

```ts
// wrong direction: make renderer-owned data ready before pointer resolution
const populateOutputsByWordAddress = () => {
	state.codeBlockRendering.outputsByWordAddress.clear();
	for (const graphicData of state.codeBlockRendering.codeBlocks) {
		outputs(graphicData, state);
	}
};

const updateAllBlockDerivedState = () => {
	populateOutputsByWordAddress();
	for (const graphicData of state.codeBlockRendering.codeBlocks) {
		updateBlockDerivedState(graphicData);
	}
};
```

This made the visible bug disappear, but only by adding a second renderer traversal and running output-widget generation twice.

## Anti-Patterns

- Treating an ordering-dependent symptom as a request for another ordering phase.
- Adding a prepass to make downstream state available instead of questioning why the consumer depended on that state.
- Using rendered connector widgets as the authoritative index of compiled memory.
- Mixing runtime pointer resolution, compiler memory metadata, widget construction, and z-order inside the rendering lifecycle.
- Accepting a passing UI regression test without checking whether the fix strengthened the incorrect subsystem boundary.
- Increasing work in a frequently triggered rendering update to compensate for a lookup that belonged elsewhere.

The warning sign was that selecting a block changed whether a memory identifier could be resolved. Selection and z-order are presentation state; they must not determine the meaning of a runtime pointer.

## Failure Pattern

Adding a preparation pass in the subsystem where a symptom appears instead of removing its dependency on data owned by another subsystem.

## Correct Solution

Dereferencing should stay within memory resolution:

1. Resolve the pointer declaration by module and identifier from the compiler memory plan.
2. Read the pointer's current byte address from runtime memory.
3. Use the pointer's pointee memory-region metadata to reverse-resolve that address to a planned memory declaration.
4. Return the resolved declaration to the watch directive.
5. Let rendering create a debugger widget from that result without participating in pointer semantics.

The regression test should prove this ownership boundary directly: `resolveMemoryIdentifier(state, moduleId, '*pointer')` must resolve the pointee while `codeBlockRendering.outputsByWordAddress` is empty. A browser-level test should additionally keep the watched block behind other blocks and select a different block, confirming that presentation order no longer affects the value.

The general lesson is to investigate why superficially similar forms take different dependency paths. When only the dynamic form fails, trace the dynamic lookup to its authoritative model before adding lifecycle coordination to the place where the failure becomes visible.
