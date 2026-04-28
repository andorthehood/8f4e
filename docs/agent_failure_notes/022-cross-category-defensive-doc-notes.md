---
title: Agent Failure Note – Cross-Category Defensive Doc Notes
agent: Codex App Version 26.309.31024 (962)
model: gpt-5.4 (medium)
date: 2026-03-16
---

# Agent Failure Note – Cross-Category Defensive Doc Notes

## Short Summary

When documenting a new feature in one category, the agent added a warning in a different category's documentation to say that the feature does not belong there. This created unnecessary documentation coupling and made the unrelated page worse.

## Original Problem

The runtime host selection was moved to editor config `; @config runtime <id>`.

The agent then added this sentence to `packages/editor/docs/runtime-directives.md`:

- "Runtime host selection is not a runtime directive. Use editor config `; @config runtime <id>` instead."

The user correctly objected that nobody had asked for that clarification and that it made the page feel like it was documenting what it is not about, rather than what it actually covers.

## Incorrect Fix Attempted (Anti-Pattern)

The agent tried to make the documentation "safer" by adding a defensive note to an unrelated document:

```md
Runtime host selection is not a runtime directive. Use editor config `; @config runtime <id>` instead.
```

This is the same class of mistake as adding a note about array sorting to type-casting docs just to say sorting is not type casting.

## Failure Pattern

When introducing a feature in one category, the agent pollutes another category's documentation with negative clarification about that feature not belonging there.

## Correct Solution

Keep documentation scoped to what the page actually owns:

1. Document `@config runtime` in `editor-directives.md`.
2. Document actual runtime directives in `runtime-directives.md`.
3. Do not add cross-category defensive disclaimers unless there is a proven recurring confusion that justifies it.

## Prevention Guideline

**Documentation Scope Rule**: Do not improve one document by inserting "this other thing is not part of this category" notes into another document. Put features in their correct home and keep unrelated pages silent about them.
