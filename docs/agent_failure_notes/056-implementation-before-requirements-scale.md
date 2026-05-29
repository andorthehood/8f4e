---
title: Agent Failure Note - Implementation before requirements scale
agent: Codex
model: GPT-5.5 (high)
date: 2026-05-27
---

# Agent Failure Note - Implementation before requirements scale

## Short Summary

The agent jumped from a plausible diagnosis directly to an implementation strategy before learning the scale and performance requirements of the data involved. The proposed fix would have expanded buffer ranges into per-word map entries, which is unacceptable when buffers may contain hundreds of thousands of elements.

## Original Problem

Connection wires were not rendered when an input pointer targeted an address inside a buffer rather than the buffer's first byte address. The drawer used an exact lookup from the pointer value to an output widget, while outputs were registered only by their starting `memory.byteAddress`.

The user pointed out the likely cause: buffer interior addresses were not matched because the lookup only covered the first address. The agent immediately moved toward "fixing" this by registering every word address in the output allocation.

That implementation instinct was wrong because it assumed small allocations and optimized for local simplicity instead of first asking how large buffers can be and what lookup complexity is acceptable in the render path.

## Anti-Patterns

- Treating a correct diagnosis as permission to implement the first obvious data-structure change.
- Expanding a range into individual map entries without checking the maximum possible range size.
- Optimizing for a small unit test instead of the real runtime scale.
- Forgetting that editor drawer code runs in a render-sensitive path.
- Failing to ask a requirements question when the problem statement included a hint about buffers.
- Moving toward code before confirming whether the desired behavior is "wire points to the owning buffer" or something more precise.

```ts
// wrong direction: expands potentially huge buffers into per-word entries
for (let offset = 0; offset < memory.wordAlignedSize; offset++) {
	outputsByWordAddress.set(memory.byteAddress + offset * 4, output);
}
```

This looks attractive because it preserves an exact `Map#get` call at draw time, but it pushes unbounded memory and initialization costs into graphic-data construction. For large buffers, it is the wrong tradeoff.

## Failure Pattern

Implementing from a plausible local model before learning the real data scale and behavioral requirements.

## Correct Solution

Pause after diagnosis and ask or infer the missing constraints before proposing code. For address ownership, the right design space is range-based resolution, not per-element registration.

A better direction would keep exact lookup for scalar and start-address hits, then use a compact range index for allocations with size. The range lookup should be designed around actual constraints, for example sorted non-overlapping ranges with binary search or another structure that keeps memory proportional to the number of outputs rather than the number of buffer elements.

Before editing code, clarify:

- expected maximum buffer sizes
- whether lookup happens on every frame
- whether ranges can overlap or alias
- whether interior pointers should visually connect to the owning buffer widget
- where range ownership belongs in editor state versus drawer code

The lesson is not "never propose an implementation." It is: when the user is asking about behavior and the data may be large, learn the requirements boundary before turning the first plausible fix into code.
