---
title: Agent Failure Note - Hidden metadata helper to avoid snapshot updates
agent: Codex App
model: GPT-5.5 (high)
date: 2026-05-25
---

# Agent Failure Note - Hidden metadata helper to avoid snapshot updates

## Short Summary

The agent reintroduced the hidden-metadata anti-pattern during resolved identifier line-form work by adding a reusable `withHiddenProperty(...)` helper. The helper carried semantic proof data through the compiler while keeping snapshots and enumerable line output unchanged, which hid a real representation change.

## Original Problem

The refactor goal was to harden compiler type interfaces so semantic normalization would carry resolved identifier facts into stack analysis and codegen. Once normalization proved that a `push`, `call`, `localSet`, or loop-index reference targeted a specific memory item, local binding, function, or loop counter, later phases should consume that explicit proof instead of rediscovering it or defending against impossible misses.

Instead of making those fields explicit immediately, the agent introduced:

```ts
export function withHiddenProperty<TObject extends object, TKey extends PropertyKey, TValue>(
	object: TObject,
	key: TKey,
	value: TValue
): TObject & Record<TKey, TValue> {
	return Object.defineProperty({ ...object }, key, {
		value,
		enumerable: false,
		configurable: true,
		writable: true,
	}) as TObject & Record<TKey, TValue>;
}
```

That avoided snapshot churn by making `resolvedTarget`, `targetFunction`, `local`, and `loopCounterLocal` available at runtime without showing them in normal serialized output. This repeated the failure already documented in `043-hidden-metadata-to-avoid-snapshot-updates.md`.

## Anti-Patterns

- Adding a general-purpose hidden-metadata helper to make a test-avoidance workaround look like architecture.
- Treating snapshots as an obstacle when they are exposing the compiler representation change reviewers need to see.
- Calling the metadata "internal" as a reason to hide it, even though the project is unreleased and we own every consumer.
- Making TypeScript believe a field is a normal property while object spread, JSON serialization, and snapshot output silently disagree.
- Preserving old line output while claiming the type contract has been hardened.

## Failure Pattern

Avoiding legitimate test and snapshot updates by hiding new semantic compiler fields behind non-enumerable object properties.

## Correct Solution

Make the resolved compiler facts explicit on the normalized/compiler line forms and update tests honestly:

```ts
return {
	...line,
	resolvedTarget: { kind: 'local', local },
};
```

For this project, do not add compatibility behavior or hidden fields to preserve old internal representations. If a refactor changes the compiler contract, update all in-repo consumers and snapshots so the new contract is visible. Snapshot churn is acceptable when it reflects the actual model the compiler now depends on.
