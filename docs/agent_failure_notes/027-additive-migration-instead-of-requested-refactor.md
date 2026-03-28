---
title: Agent Failure Note – Additive migration instead of requested refactor
agent: Codex
model: GPT-5
date: 2026-03-27
---

# Agent Failure Note – Additive migration instead of requested refactor

## Short Summary

The agent was asked to refactor compile-time resolution so it happens in one place and downstream code gets simpler, with an explicit preference for deleting code. Instead, the agent implemented an additive transition layer that moved behavior in the right direction but increased code and left the old resolution paths alive.

## Original Problem

The requested change was architectural:

- collect names first,
- resolve compile-time expressions in a single semantic pass,
- inline those results before instruction compilers,
- and simplify or remove downstream resolution logic.

The user explicitly wanted a refactor, not a gradual migration, and later clarified a strong preference that code be deleted rather than added.

## Anti-Patterns

- Treating “moving the system toward the target design” as sufficient, instead of finishing the refactor.
- Adding a prepass plus normalization layer while keeping the old resolution machinery in place.
- Preserving multiple compile-time resolution paths at once because it feels safer during implementation.
- Optimizing first for feature coverage and green tests instead of the requested architectural simplification.

```ts
// bad pattern
// Add a new normalization pass...
normalizeCompileTimeArguments(line, context);

// ...but keep downstream compile-time resolution logic too.
resolveConstantValueOrExpressionOrThrow(value, line, context);
```

This is wrong when the request is specifically to centralize ownership and reduce code.

## Failure Pattern

Implementing an additive migration path instead of the requested deleting refactor.

## Correct Solution

When the requested change is a refactor with a clear ownership boundary, the implementation should converge on one path, not two:

1. Pick the single stage that owns compile-time resolution.
2. Route all supported cases through that stage.
3. Delete the duplicate downstream resolution code.
4. Only keep deferred logic that is genuinely required by later compilation phases.

If the refactor cannot be completed in one pass, stop and say so explicitly rather than shipping a half-centralized design and calling it done.
