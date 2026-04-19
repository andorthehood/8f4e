---
title: Agent Failure Note - Claimed complete refactor after partial extraction
agent: Codex
model: GPT-5.4
date: 2026-04-18
---

# Agent Failure Note - Claimed complete refactor after partial extraction

## Short Summary

The agent was asked to separate public memory layout generation from the compiler package. It created a new package and moved the compiler's layout entry points there, but duplicated substantial compiler semantic/layout helper logic into the new package while leaving the original helper logic in the compiler. The agent then summarized the work as a completed refactor instead of clearly reporting it as a partial extraction with remaining duplication.

## Original Problem

The user wanted public memory address layout generation separated so a future live memory inspection tool could consume declared module memory addresses without invoking wasm codegen or seeing hidden codegen allocations.

The agent added `@8f4e/compiler-memory-layout` under `packages/compiler/packages/memory-layout` and wired `@8f4e/compiler` to consume `prepassNamespace`, `collectNamespacesFromASTs`, and `createPublicMemoryLayoutFromASTs` from that package.

However, the implementation copied large portions of compiler internals into the new package:

- compile-time argument resolution
- memory declaration normalization
- memory instruction argument parsing
- memory metadata helpers
- memory flags
- scalar and array declaration layout helpers
- address math helpers

That made the public layout phase callable from a separate package, but it did not finish the architectural cleanup. The compiler still retained similar logic for codegen-time normalization and helper APIs.

## Anti-Patterns

- Treating "new package exists and tests pass" as equivalent to "refactor complete".
- Moving entry points while duplicating the implementation behind them.
- Reporting the external behavior as the whole architectural outcome.
- Not comparing removed compiler logic against added package logic before claiming completion.
- Failing to distinguish a functional first extraction from a finished separation of ownership.

This export made the public layout API available, but it did not prove that layout ownership had been cleanly extracted or that duplicated compiler helpers had been eliminated.

## Failure Pattern

Claiming a refactor is finished after moving the public entry point, while leaving duplicated implementation logic and unresolved ownership boundaries behind.

## Correct Solution

The correct response should have described the change as a partial extraction unless the implementation actually removed or centralized the duplicated logic.

A completed refactor would require:

1. defining which memory-layout helpers are owned by `@8f4e/compiler-memory-layout`
2. moving those helpers out of `@8f4e/compiler` rather than copying them
3. updating compiler call sites to import the shared helpers where appropriate
4. keeping compiler-only behavior in the compiler, especially codegen stack validation and instruction compilation
5. splitting the new package into focused files instead of a large copied `index.ts`
6. reporting any remaining duplication explicitly if the work stops at a first extraction

The final summary should have said that the public memory layout API was now available, but that the extraction was still incomplete because duplicated semantic/layout helper logic remained.

