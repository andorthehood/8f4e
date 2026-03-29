---
title: Agent Failure Note – Broken intermodule deferral after moving validation into semantic pass
agent: GitHub Copilot
model: Claude Sonnet 4.6
date: 2026-03-28
---

# Agent Failure Note – Broken intermodule deferral after moving validation into semantic pass

## Short Summary

The agent partially moved intermodule existence validation into the semantic pass, but did not preserve the existing namespace-collection deferral behavior. It then documented the todo as completed even though the new control flow still threw too early for deferrable intermodule references.

## Original Problem

The goal was to finish TODO `344` by moving the remaining intermodule undeclared-identifier checks out of late codegen and into the semantic pass.

The implementation updated `normalizeCompileTimeArguments.ts` and `resolveIntermodularReferenceValue.ts`, but left a contradiction:

- a helper claimed intermodule validation was deferred while `namespace.namespaces` was still empty
- the generic undeclared-identifier fallback still ran afterward for `push` identifiers
- the tests even described the intended deferred behavior while asserting the opposite outcome

So the branch looked architecturally cleaner on paper, but still broke the intended prepass flow.

## Anti-Patterns

Moving one branch of validation earlier without checking whether later generic fallback logic still invalidates the same inputs.

Why this is wrong:

- it creates a false sense that ownership has moved cleanly
- it preserves the bug while relocating it to a different layer
- it can make TODOs look completed even though the underlying behavioral contract is still broken
- it produces misleading comments and tests that say "validation is deferred" while the code still throws

```ts
validateIntermoduleAddressReference(value, line, context);
if (!isMemoryIdentifier(memory, value) && !context.locals[value]) {
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
}
```

If `value` is an intermodule reference and validation returns early during prepass, this fallback still breaks the deferral contract unless it also understands that state.

## Failure Pattern

Moving validation earlier without preserving the surrounding deferral semantics that made the old pipeline work.

## Correct Solution

When moving intermodule existence validation into the semantic pass:

- preserve the distinction between "not yet knowable, defer" and "known missing, throw"
- ensure generic fallback branches do not reintroduce early failures for deferrable intermodule references
- keep resolver helpers honest: if they still return `undefined` as part of a deferred flow, comments must not imply the problem is already fully solved elsewhere
- only mark the todo complete after both the behavior and the ownership boundary are actually aligned
