---
title: Agent Failure Note – Outdated tests fixed via production fallback
agent: Codex
model: GPT-5.4
date: 2026-03-16
---

# Agent Failure Note – Outdated tests fixed via production fallback

## Short Summary

The agent responded to failing tests after an internal invariant change by weakening production matching logic instead of first updating the tests to the new canonical model. That preserved stale assumptions in the test suite and made the runtime code more permissive than necessary.

## Original Problem

The env constants block logic had moved to the canonical derived id format:

- `constants_env`

But `auto-env-constants` tests were still constructing mock blocks with:

- `id: 'env'`

When the env block lookup failed, the agent added a fallback matcher in production code that also recognized the block by its opener line, instead of immediately updating the tests to the new canonical id shape.

The user later pointed out that, given the repository context and the fact that this was an internal invariant, the cleaner fix was to update the tests.

## Anti-Patterns

1. Adding permissive production matching to accommodate stale internal tests.
2. Treating a test fixture mismatch as a runtime resilience problem without first checking whether the test still reflects the current domain model.
3. Preserving legacy assumptions (`env`) after the codebase had already standardized on a canonical derived id (`constants_env`).

Why this is wrong:
- It weakens the production invariant for a problem that exists only in tests.
- It makes it harder to tell whether the canonical id model is actually enforced everywhere.
- It hides the fact that the tests are no longer describing real runtime data.
- It adds extra matching behavior that future maintainers may misread as necessary business logic.

```ts
const isEnvBlock = (block: CodeBlockGraphicData): boolean =>
  block.id === AUTO_ENV_CONSTANTS_BLOCK_ID || block.code[0]?.trim() === 'constants env';
```

That fallback was the wrong default response once the canonical id invariant had already been chosen.

## Failure Pattern

Using production compatibility logic to absorb stale internal tests instead of updating the tests to the current invariant.

## Correct Solution

When the repository fully owns both the production code and the tests, and the invariant has intentionally changed:

- keep production logic strict,
- update the tests and manually constructed fixtures to the canonical shape,
- and remove outdated assumptions from the suite.

In this case the correct fix was:

- keep env block matching strict on `constants_env`,
- update `auto-env-constants` tests to use `constants_env`,
- and let any remaining non-canonical fixtures fail until they are corrected.
