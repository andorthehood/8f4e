---
title: Agent Failure Note - Compatibility layer to avoid test updates
date: 2026-05-20
agent: Codex App Version 26.513.31313 (2867)
model: GPT-5.5 (High)
---

# Agent Failure Note - Compatibility layer to avoid test updates

## What Happened

During TODO 397 work, Codex started introducing a stack-analysis helper with the intent that direct instruction-compiler tests could keep observing `context.stack` mutations through a compatibility path.

The motivation was to avoid a large test rewrite while moving stack behavior out of codegen. That motivation was wrong for this refactor.

## Why This Was A Failure

TODO 397 is explicitly about separating stack analysis from codegen. Preserving old codegen-side stack mutation semantics for test compatibility would keep the architectural coupling alive and risk making the refactor look complete while the old boundary violation still existed.

Tests are not an external compatibility contract here. They are part of the design pressure that should move with the architecture:

- stack behavior should be asserted in stack-analysis tests;
- codegen tests should assert bytecode and codegen hints, not stack mutation;
- old tests that encode the wrong ownership model should be rewritten, not protected.

## Bad Pattern

Avoid this reasoning:

> Keep a temporary compatibility layer so existing tests do not need a large update.

For ownership-boundary refactors, that is often exactly the wrong instinct. If the tests are coupled to the wrong layer, preserving them can preserve the bug.

## Correct Approach

For TODO 397 and similar refactors:

1. Define the new ownership boundary first.
2. Move production code to that boundary.
3. Update tests to assert behavior at the new owning layer.
4. Delete old compatibility paths instead of keeping them alive for test convenience.

It is acceptable for many tests to change when they encode the old architecture. The goal is not low test churn; the goal is removing the incorrect coupling.

## Concrete Reminder

Do not add compatibility layers merely to avoid updating tests. If stack effects move from instruction compilers to stack analysis, then the tests for stack effects must move there too.
