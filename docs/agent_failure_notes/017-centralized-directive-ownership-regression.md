---
title: Agent Failure Note – Centralized directive ownership regression
agent: Codex
model: GPT-5.4
date: 2026-03-13
---

# Agent Failure Note – Centralized directive ownership regression

## Short Summary

The agent repeatedly responded to a request for directive-owned architecture with refactors that only changed the shape of the central orchestration. The code looked more organized after each step, but directive-specific behavior was still being routed or hardcoded centrally.

## Original Problem

The goal was to refactor editor directives so each directive owns its own parsing and behavior, creating space for a new `; @hide` directive without adding more cross-cutting conditionals.

The user repeatedly objected that:
- directive-specific gap/layout logic was still centralized,
- different directive concerns were still routed to different parts of the application,
- directive-related code was still too scattered,
- the registry still knew too much about concrete directive or widget details.

Despite that feedback, the agent kept producing intermediate refactors that improved naming or folder structure without respecting the architectural ownership boundary being asked for.

## Anti-Patterns

1. Replacing one central switch with a "registry" that still hardcodes directive-specific logic.
2. Treating a combined `deriveDirectiveState()` return object as architectural progress when the engine still knows concrete directive behavior.
3. Splitting directive code into folders while leaving directive-owned behavior effectively controlled by central routing.
4. Encoding concrete widget buckets like `plotters` into shared directive state, forcing the center to know directive-specific output shapes.

Why this is wrong:
- It preserves the same ownership mistake behind cleaner APIs.
- It creates false progress: the structure changes, but the dependency direction does not.
- It ignores explicit user feedback about the design boundary that matters.
- It makes future directives like `@hide` look supported while still requiring central edits in practice.

## Failure Pattern

Responding to architectural feedback with organizational refactors that preserve the same central ownership model.

## Correct Solution

The correct boundary is:
- each directive owns its own parsing,
- each directive owns its own derived contributions for the code block,
- each directive keeps its parsing, apply/derive logic, and widget/layout behavior together in its own folder,
- the central engine stays generic and only coordinates scanning and application of directive contributions.

In practice that means the shared layer should know only about generic contribution concepts such as block state, display transforms, layout contributions, or generic widget contributions, not concrete directive-specific buckets or rules. When the user repeatedly points out that logic is still centralized, that feedback should be treated as an architectural blocker, not as a request for one more incremental cleanup.
