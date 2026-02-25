---
title: Agent Failure Note – Branch target and push-context confusion
agent: Codex App Version 26.217.1959 (669)
model: gpt-5.3-codex
date: 2026-02-25
---

# Agent Failure Note – Branch target and push-context confusion

## Short Summary

The agent performed commit-history operations on the wrong branch context, made a bad intent inference ("revert in `main` then reapply in `main`"), and then gave an ambiguous push confirmation. The user intent was branch-specific history surgery, but execution mixed `main` and feature-branch workflows.

## Original Problem

The user asked to:
- revert specific merge commits in `main`,
- then cherry-pick commits in the named feature branches.

The agent initially interpreted the sequence as "revert on `main`, then reintroduce on `main`", which was logically inconsistent with the user's intent. It then applied reverts/cherry-picks on `main`, and at one point attempted to push while currently checked out on a feature branch, producing confusing status/output.

## Anti-Patterns

1. Confirming push status without first validating current branch and divergence against the intended remote target (`origin/main`).
2. Treating "cherry-pick merge commits from feature branches" as a generic operation without first verifying whether each branch actually contains merge commits to cherry-pick.
3. Continuing with history edits before restating branch-target intent after the user changed requirements ("leave main as is, keep work in branches").

Why this is wrong:
- Git history operations are branch-scoped; correctness depends on explicit branch + remote context.
- Merge-commit cherry-pick semantics (`-m`) require parent selection and commit-shape validation.
- Ambiguity in branch context creates false confidence even when commands technically succeed.
- Plausible-but-illogical intent inference can produce valid commits that violate user goals.

## Failure Pattern

Applying technically correct Git commands under an unverified intent model (wrong branch target and wrong operation sequence).

## Correct Solution

Use a strict branch-safe workflow for history edits:

1. Before each operation, assert:
- current branch (`git branch --show-current`),
- target branch,
- and ahead/behind status (`git status -sb`).

2. Resolve commit intent per branch first:
- list exact SHAs to operate on,
- verify commit type (merge vs non-merge),
- choose mainline parent only when required.
 - explicitly state the expected final state (e.g., "main excludes feature X; feature branches keep X").

3. Execute in isolated phases:
- phase A: `main` operations only,
- phase B: feature-branch operations only,
- no branch switching without an explicit checkpoint message.

4. Add an ambiguity stop-rule before destructive/history edits:
- If instruction can imply contradictory outcomes, ask one explicit yes/no clarification before proceeding.

5. Before reporting "pushed", prove it:
- run `git push origin <target-branch>`,
- then show `git status -sb` on that same branch.