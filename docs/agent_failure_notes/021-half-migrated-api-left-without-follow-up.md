---
title: Agent Failure Note – Half-migrated API left without follow-up
agent: Codex App Version 26.309.31024 (962)
model: gpt-5.4 (medium)
date: 2026-03-16
---

# Agent Failure Note – Half-migrated API left without follow-up

## Short Summary

The agent fixed the implementation behavior but left a legacy-shaped API behind (`parsePos(code, parsedDirectives)`) even though the function no longer needed raw code. Worse, it did not either finish the cleanup immediately or create a follow-up todo, which made it likely that the half-migration would persist indefinitely.

## Original Problem

The editor-state directive work had moved consumers onto centralized `parsedDirectives`. During that migration, `parsePos` was updated so it no longer reparsed raw code internally, but its signature still kept the old `code` argument:

```ts
parsePos(code, parsedDirectives)
```

That meant the logic had the new contract, while the API still advertised the old one. The user later pointed out that this kind of leftover is exactly what ends up staying in the codebase forever if it is not removed immediately.

## Anti-Patterns

1. Stopping at behavioral correctness instead of finishing the API migration.
2. Preserving an obsolete argument solely because it reduced short-term patch size.
3. Leaving known cleanup behind without creating a todo, note, or follow-up task.

Why this is wrong:
- It leaves a misleading contract in the code, which invites future callers to keep passing raw code around unnecessarily.
- It obscures whether centralized parsed directives are truly the source of truth.
- It creates “ghost dependencies” where a function appears to need more data than it actually does.
- Without a tracked follow-up, these half-migrations tend to become permanent accidental architecture.

## Failure Pattern

Completing the logic migration but not the API migration, and failing to explicitly track the leftover cleanup.

## Correct Solution

When a refactor changes the real ownership boundary, the API should be finished in the same pass whenever feasible.

In this case the correct response was:

- change `parsePos` to accept only `parsedDirectives`,
- update all call sites immediately,
- update tests to match the new contract,
- and if any part truly had to be deferred, create a follow-up todo in the repository at the same time.

The key rule is:

- never knowingly leave a half-migrated internal API behind without tracked follow-up work.
