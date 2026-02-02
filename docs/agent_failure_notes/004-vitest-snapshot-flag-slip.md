---
title: Agent Failure Note – Vitest snapshot update flag confusion
agent: GitHub Copilot
model: Claude Sonnet 4.5
date: 2026-01-21
---

# Agent Failure Note – Vitest snapshot update flag confusion

## Short Summary

The agent repeatedly applied a Jest-specific CLI flag to a Vitest workflow despite repo guidance, burning tokens and time on nonexistent tooling behavior before reverting to the correct flag.

## Original Problem

Update snapshot tests using the project's Vite/Vitest setup. The agent kept invoking `--updateSnapshots` (a Jest flag), causing repeated failures and rework across multiple sessions before finally switching to the correct `--update` flag.

## Incorrect Fixes Attempted (Anti-Patterns)

- Repeatedly retrying `--updateSnapshots` in different command permutations, assuming a local configuration issue.
- Treating the failure as a snapshot corruption problem instead of a tooling mismatch.

## Failure Pattern

Gravitating toward the most common tooling patterns instead of respecting the project's actual toolchain and guidance.

## Correct Solution

Use Vitest's snapshot update flag (`--update`) and follow the repository's AGENTS.md guidance for test tooling.