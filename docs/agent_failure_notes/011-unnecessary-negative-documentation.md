---
title: Agent Failure Note – Documenting What Features Are NOT
agent: GitHub Copilot Agent
model: Claude 3.5 Sonnet
date: 2026-02-09
---

# Agent Failure Note – Documenting What Features Are NOT

## Short Summary

When removing a feature from documentation, the agent added unnecessary negative statements explaining what the removed feature is NOT, cluttering the documentation with irrelevant information that readers wouldn't expect to see.

## Original Problem

The agent was asked to remove hash (`#`) as a comment marker from the compiler. After removing the hash comment support from the code, the agent updated `packages/compiler/docs/comments.md` to document the change.

However, instead of simply removing the "Hash Comments" section, the agent replaced it with a "Hash Symbol" section that explicitly stated:
- "The hash symbol (`#`) is **not** treated as a comment marker."
- "It is reserved for future compiler directives..."
- "If you need to add comments in your code, use the semicolon (`;`) marker."

The user correctly identified this as problematic: "You don't need to make a remark about the # hash symbol here, nobody would understand why is it mentioned here that it is not treated as a comment marker. You wouldn't list all the possible characters which are not treated as characters, would you."

## Incorrect Fix Attempted (Anti-Pattern)

When removing a feature from both code and documentation, the agent felt compelled to explain the removal in the documentation by adding negative statements about what the feature is NOT or does NOT do.

This creates documentation clutter by:
1. Mentioning features/characters that have no relevance to the current functionality
2. Confusing readers who wonder why this specific character/feature is singled out
3. Adding maintenance burden for information that provides no value

```md
## Hash Symbol (`#`)

The hash symbol (`#`) is **not** treated as a comment marker. It is reserved for future compiler directives...
```

This is equivalent to documenting: "The `@` symbol is not a comment marker. The `%` symbol is not a comment marker..." which would be absurd.

## Failure Pattern

Adding negative documentation statements ("X is NOT a feature") when removing features, rather than simply omitting them from the documentation entirely.

## Correct Solution

When a feature is removed:
1. **Simply remove the documentation section** about that feature
2. **Do not add explanatory text** about what the removed feature is NOT
3. **Do not preemptively document** future planned features unless they exist

The correct documentation should only describe what IS supported:

```md
# Comments

The 8f4e language supports comments using the semicolon marker.

## Semicolon Comments (`;`)

Lines starting with a semicolon are treated as comments and are ignored by the compiler:

(examples...)
```

Clean, direct, and no mention of unrelated characters or removed features.

## Prevention Guideline

**Documentation Rule**: Only document features that exist and work. Never add sections explaining what a feature is NOT or documenting removed functionality. If users need a migration guide, create a separate migration document—don't clutter the feature documentation.
