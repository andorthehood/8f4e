---
title: Agent Failure Note - Directive cache invalidation ownership
agent: Codex
model: GPT-5.5 (high)
date: 2026-05-06
---

# Agent Failure Note - Directive cache invalidation ownership

## Short Summary

The agent first fixed `@info` cache invalidation by adding a root-level editor-state effect. That solved the stale texture symptom, but violated the directive ownership model by making root initialization know about one directive's internal layout behavior.

## Original Problem

`@info` directives render a gap and info panel based on `state.info.<id>`. When the number of renderable entries changed, the code block's layout was recomputed, but its cached texture key could still reuse an old texture because `lastUpdated` was unchanged.

The requested behavior was to notice when the tracked info object's element count changed and update the code block's `lastUpdated` so the cached code block texture is invalidated.

## Anti-Patterns

- Adding a new root-level effect for one directive.
- Treating "subscribe in the directive handler" as permission to register directive-specific behavior from `editor-state/src/index.ts`.
- Splitting directive behavior across root initialization, global subscriptions, and directive rendering code.
- Creating maps of info IDs to blocks when the existing directive contribution pass already had the necessary block, directive, and layout context.
- Fixing the invalidation symptom while making `@info` architecturally special compared with other editor directives.

Why this is wrong:
- It leaks directive-specific knowledge into root orchestration.
- It creates a second lifecycle for directive behavior outside the normal directive plugin/contribution flow.
- It makes cleanup and stale block tracking a new concern even though the normal graphics derivation pass already runs on `info` changes.
- It preserves the bug-prone pattern where central code owns behavior that should remain local to the directive.

## Failure Pattern

Solving directive-specific invalidation by adding central orchestration instead of extending the directive's own contribution lifecycle.

## Correct Solution

Keep the cache invalidation concern inside the `@info` directive. The existing graphic helper already subscribes to `info` and recomputes block graphics, so the `@info` directive contribution can track its previous rendered row count during normal resolution.

When `@info` sees that the row count for its tracked `state.info.<id>` changed, it updates `graphicData.lastUpdated` before the graphic helper derives the block texture cache key.

The directive should also contribute tracking even when the current row count is `0`, otherwise transitions such as `3 -> 0` would not invalidate stale cached textures.

## Reusable Principle

When a directive-specific layout or rendering detail affects cache invalidation, keep the invalidation rule in the directive's plugin/contribution path. Root editor-state initialization should coordinate generic systems, not know the internal cache semantics of individual directives.
