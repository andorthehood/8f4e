---
title: Agent Failure Note – Type contract refactor outran typecheck gates
agent: Codex App Version 26.313.41514 (1043)
model: GPT-5.4 (medium)
date: 2026-03-29
---

# Agent Failure Note – Type contract refactor outran typecheck gates

## Short Summary

The agent expanded a typing-heavy refactor across multiple rounds in one session without repeatedly running the relevant workspace typecheck gate. By the time full verification ran, the type surface had drifted so far that the branch failed badly, required stash recovery, and forced rework just to get back to a coherent state.

## Original Problem

The goal was to complete TODO `345` by tightening the typed contract between tokenizer output, semantic normalization, and compiler consumers.

Instead of making one small typed slice and verifying it immediately, the agent:

- added increasingly strict instruction-specific line types
- threaded those types through compiler, semantic normalization, and validation wrappers
- kept expanding the scope before running the full `@8f4e/compiler:typecheck` gate

When full typechecking finally ran, it exposed a broad set of incompatibilities:

- narrowed instruction compilers still saw broad `Argument` values internally
- handler dispatch points were passing broad lines into narrow handler signatures
- semantic stage boundaries still needed casts or stronger staged types

The branch then failed pre-commit badly enough that the intended work had to be restored from stash and repaired afterward.

## Anti-Patterns

Treating a typing-heavy architectural refactor like ordinary local cleanup and deferring the real typecheck gate until late in the session.

Why this is wrong:

- type-level refactors often fail far away from the file being edited
- partial narrowing can look locally correct while breaking call sites, registries, wrappers, and generic utilities elsewhere
- late verification multiplies recovery cost because more files need to be untangled at once
- it wastes user time and compute by forcing rollback/recovery instead of incremental progress

```ts
// Wrong execution pattern:
// 1. Add many stricter types across multiple stages
// 2. Rely on local reasoning and partial tests
// 3. Run the real typecheck gate only after the surface area is already large
```

Another anti-pattern was continuing to add more type structure after earlier rounds had not yet been proven against the real compiler typecheck boundary.

## Failure Pattern

Letting a cross-cutting type refactor outrun its verification loop until recovery work dominates forward progress.

## Correct Solution

For typed-contract refactors like this:

- make one narrow slice at a time
- run `npx nx run @8f4e/compiler:typecheck --skipNxCache` after each slice before expanding further
- only move to the next instruction family or stage boundary once the current one is green
- treat pre-commit or workspace typecheck failures as a signal to stop broadening the change, not to keep layering types on top

If the refactor starts touching wrappers, registries, dispatchers, and multiple stages at once, the typecheck gate must become the primary progress checkpoint rather than a final validation step.
