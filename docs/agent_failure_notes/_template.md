---
title: Agent Failure Note – <short descriptive title>
agent: <tool or agent name>
model: <model or models used>
date: YYYY-MM-DD
---

# Agent Failure Note – <short descriptive title>

## Short Summary

One or two sentences describing what went wrong at a systems level. Focus on the mismatch between intent and outcome, not the surface symptom.

## Original Problem

What the agent was asked to do and what failed.

Include concrete symptoms or error messages if useful.

## Anti-Patterns

List approaches that looked reasonable but were wrong.

Explain *why* they are wrong in system terms, not just that they failed.

```ts
// optional illustrative snippet
```

## Failure Pattern

A single sentence naming the generalizable pattern.

Example:
Treating a build or orchestration problem as a local code or test issue.

## Correct Solution

What actually fixed the problem, or what should have been done instead. Emphasize architectural ownership and decision boundaries.


