---
title: Agent Failure Note - Hidden metadata to avoid snapshot updates
agent: Codex App
model: GPT-5.5 (high)
date: 2026-04-30
---

# Agent Failure Note - Hidden metadata to avoid snapshot updates

## Short Summary

The agent implemented address provenance by hiding compiler metadata on normalized literal objects as a non-enumerable property. This avoided updating many snapshot tests, but it introduced a fragile, implicit data path in compiler internals.

This failure repeated on 2026-05-25 during resolved identifier line-form work: the agent added a generic `withHiddenProperty(...)` helper to attach resolved `push`, `call`, `localSet`, and loop metadata without changing enumerable normalized/compiler line output. The stated goal of the refactor was to harden type interfaces and remove runtime ambiguity; hiding the new fields to avoid snapshot churn worked against that goal.

## Original Problem

The user wanted tracked stack items to carry address-range metadata when they came from an address-safe source such as `push &foo`. The intended direction was to preserve provenance so later memory operations could distinguish an arbitrary integer from a compiler-proven safe address.

Instead of making that provenance explicit in the normalized codegen argument shape and updating snapshots honestly, the agent used:

```ts
Object.defineProperty(literal, 'memoryAddress', {
	value: resolved.memoryAddress,
	enumerable: false,
	configurable: true,
});
```

Codegen could read `literal.memoryAddress`, but `JSON.stringify`, object spread, `Object.keys`, and normal snapshot serialization would not show the property.

## Anti-Patterns

- Hiding semantic compiler data in a non-enumerable property to avoid test snapshot churn.
- Adding a reusable helper such as `withHiddenProperty(...)` to make hidden metadata feel intentional or architectural.
- Treating snapshot updates as noise even when they expose a real compiler representation change.
- Creating a field that TypeScript says exists while common object operations silently drop it.
- Preserving old serialized output by making the in-memory object graph less honest.
- Optimizing for a smaller diff instead of a clearer compiler-stage contract.
- Calling hidden metadata an "internal" representation when the project is unreleased and the correct move is to update the representation and tests together.

This is especially risky in compiler code because provenance metadata is only useful if it survives every relevant pipeline step. Non-enumerable properties are easy to lose through object spread, cloning, JSON round trips, debug tooling, or future refactors.

## Concrete Risks

- `JSON.stringify(...)` drops the metadata, so any serialize/deserialize boundary silently loses address provenance.
- Object spread (`{ ...literal }`) drops the metadata, which is common in AST normalization code.
- `Object.assign(...)`, many clone helpers, and many test fixture builders can drop or fail to preserve the metadata unless they copy property descriptors explicitly.
- `structuredClone(...)` and message-passing boundaries may not preserve the property descriptor semantics expected by codegen.
- Snapshot output hides the metadata, so tests can appear stable while the compiler's real in-memory behavior changed.
- Debug output, `Object.keys(...)`, and normal object inspection hide the field, making bugs harder to notice.
- Future maintainers may not realize the compiler depends on a hidden property because it is absent from serialized AST examples.
- TypeScript suggests the field is a normal property, but ordinary object operations do not treat it like one.
- A refactor that spreads or serializes normalized arguments can silently turn a proven safe address back into an ordinary integer.
- The memory-safety proof can fail closed or fail open depending on later guard policy, making the eventual load/store safety behavior fragile.
- It creates two truths for the same object: the runtime object has provenance, but the persisted/snapshotted representation does not.
- It avoids legitimate snapshot updates, so reviewers lose the chance to inspect the compiler representation change directly.

## Failure Pattern

Avoiding legitimate snapshot updates by smuggling new semantic state through hidden object properties.

The warning sign is especially strong when the code introduces a generic utility for hidden metadata:

```ts
function withHiddenProperty(object, key, value) {
	return Object.defineProperty({ ...object }, key, {
		value,
		enumerable: false,
	});
}
```

That kind of helper makes the workaround easy to reuse and harder to notice in review. If a refactor is meant to strengthen compiler contracts, new semantic fields should be explicit in the relevant normalized/analyzed/codegen types.

## Correct Solution

Make the provenance explicit in a compiler-owned codegen type, even if that requires updating snapshots:

```ts
type CodegenPushArgument =
	| ArgumentLiteral
	| {
			type: 'resolved-address';
			value: number;
			isInteger: true;
			memoryAddress: MemoryAddressRange;
	  };
```

The compiler should distinguish a plain integer literal from a resolved address in the typed contract. If serialized snapshots change, update them as part of the feature because the compiler now preserves address provenance intentionally. Do not hide metadata purely to keep snapshot output stable.

For resolved compiler facts, use the same rule:

```ts
return {
	...line,
	resolvedTarget: { kind: 'local', local },
};
```

Then update tests and snapshots to show that the compiler representation changed. Snapshot churn is acceptable when it reflects the actual new contract; hiding it is the failure.
