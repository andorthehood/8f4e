---
title: Agent Failure Note - Protecting impossible internal states
agent: Codex App Version 26.429.30905 (2345)
model: GPT-5.5 (high)
date: 2026-05-04
---

# Agent Failure Note - Protecting impossible internal states

## Short Summary

The agent added runtime checks around compiler-owned layout data that cannot be invalid if the compiler pipeline is working correctly. Those checks made the code look safer, but they blurred the boundary between real user-facing validation and impossible internal states.

## Original Problem

The compiler was changed to initialize memory from passive data segments, then to segment those data payloads so zero-filled arrays and buffers do not bloat the generated wasm.

During that work, the agent added checks such as:

```ts
if (candidate.byteAddress + candidate.bytes.length > requiredMemoryBytes) {
	throw new RangeError(...);
}
```

and later retained shape checks around memory defaults:

```ts
const isArray = memory.numberOfElements > 1 && typeof memory.default === 'object';
```

These looked like safety checks, but the data came from already-compiled memory maps and internal resources. If those invariants fail, the compiler itself is inconsistent. That should be caught by tests around layout and codegen, not handled as a runtime branch in the segmentation implementation.

## Anti-Patterns

- Adding runtime guards for states that are only reachable if compiler-owned metadata is corrupt.
- Passing extra context into a helper solely to validate an invariant the helper should be able to trust.
- Using `typeof` checks to compensate for broad internal union types after the compiler phase has already narrowed the meaning.
- Treating impossible internal states as user-facing error cases.
- Silently accepting inconsistent metadata by falling through a defensive branch instead of letting tests expose the broken invariant.

The tempting reasoning is that more checks are safer. In compiler internals, scattered checks can instead hide ownership boundaries and make the actual contract harder to see.

## Failure Pattern

Protecting impossible internal states instead of validating real input boundaries.

## Correct Solution

Keep validation at the phase that owns the uncertainty:

- tokenizer validates syntax and raw argument shape
- semantic/layout passes build valid memory metadata
- segmentation trusts compiled memory metadata and converts it to wasm data segments

Use tests to prove internal invariants. For helper implementations, make the compiler-owned contract direct:

```ts
const isArray = memory.numberOfElements > 1;
const defaults = memory.default as Record<string, number>;
```

This keeps the code honest about what it expects. If the expectation is wrong, tests should fail close to the broken compiler phase rather than routing through defensive production behavior.

## Reusable Principle

Before adding a guard inside compiler internals, ask whether the guarded state can come from real source input at that phase. If it can, validate it with the correct error system. If it cannot, remove the guard and cover the invariant with tests.
