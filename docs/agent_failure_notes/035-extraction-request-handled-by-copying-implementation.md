---
title: Agent Failure Note - Extraction request handled by copying implementation
agent: Codex
model: GPT-5.4
date: 2026-04-19
---

# Agent Failure Note - Extraction request handled by copying implementation

## Short Summary

The agent was asked to extract public memory layout generation from the compiler package. Instead of preserving single ownership and moving implementation code, it copied compiler behavior into a new memory-layout package, left the compiler copies behind, and then added more copied surface while trying to address the duplication.

## Original Problem

The user wanted `@8f4e/compiler-memory-layout` to own public memory address generation so future live memory inspection tooling could consume those addresses without invoking compiler codegen or including hidden codegen allocations.

The intended architecture was:

- memory-layout owns public memory layout generation
- compiler consumes the memory-layout result
- compiler keeps only codegen-specific allocation, including hidden allocations appended after public memory
- no compatibility shims or duplicate transition paths, because the project has not been released

The agent initially treated the extraction as creating a new package and copying enough semantic/layout logic into it to make the package work independently. When the user asked whether everything had actually been removed from the compiler, the agent had to admit the refactor was partial.

The user then asked to remove duplication and explicitly noted that usage sites should be updated directly instead of re-exporting APIs from the compiler. The agent still left duplicated public-layout logic in place. When the user later asked naively whether any duplication remained, the agent produced a long list of duplicated areas, effectively revealing that the refactor had made the codebase worse than the requested extraction.

## Anti-Patterns

- Treating extraction as "copy code into a new package" instead of "move ownership to a new package".
- Adding a new implementation path before deleting or replacing the old one.
- Responding to a duplication concern by doing additive cleanup while still preserving duplicate behavior.
- Using passing tests as evidence of architectural correctness when the failure was ownership and duplication.
- Waiting for the user to ask directly before auditing whether duplication still existed.
- Presenting a detailed duplication inventory as if it were helpful progress, after the agent itself introduced or preserved much of that duplication.

Both paths can pass tests, but that is not an extraction. It is parallel ownership.

## Failure Pattern

Implementing a requested extraction as an additive package split, then mistaking operational availability for removed ownership and reduced duplication.

## Correct Solution

The correct solution is to move public memory layout ownership instead of copying it.

The compiler should call the memory-layout package for public declarations, public address calculation, public semantic prepass behavior, and compile-time memory metadata resolution. Compiler-side code should be deleted once memory-layout owns that behavior. Only codegen-only responsibilities should remain in the compiler, especially wasm instruction emission, stack validation, function/local handling, and hidden/internal memory allocation appended after the public memory range.

When asked whether duplication remains, the agent should audit first and answer before adding more changes. If duplication is found, the next step should be removing the duplicate implementation path, not expanding the new package while leaving the old compiler path intact.
