---
title: Agent Failure Note – Unit tests placed in the consuming package instead of the owning package
agent: GitHub Copilot
model: claude-sonnet-4-5
date: 2026-03-23
---

# Agent Failure Note – Unit tests placed in the consuming package instead of the owning package

## Short Summary

When a new helper is added to a library package and consumed by an application package, the agent wrote the unit tests for the helper inside the application package's test file rather than inside the library package that owns the function.

## Original Problem

`isCompilableBlockType()` was added to `@8f4e/compiler/syntax` (`packages/compiler/src/syntax/getBlockType.ts`). Its unit tests were written in `packages/editor/packages/editor-state/src/features/program-compiler/compiler.test.ts` — the test file of the package that _imports_ the function, not the package that _defines_ it.

The compiler package already uses in-source Vitest tests (guarded by `if (import.meta.vitest)`) for all other functions in that same file. The correct location for `isCompilableBlockType` tests was the same `getBlockType.ts` source file, exactly as was done for `getBlockType`.

## Anti-Patterns

1. **Anchoring tests to the file being edited** — the agent was editing `compiler.test.ts` in the editor-state package, so it placed the new tests there to minimize context switches, without checking where the function under test actually lives.

2. **Ignoring established in-source test conventions** — the compiler package uses `if (import.meta.vitest)` blocks embedded in source files. Adding external tests for a compiler function in a different package bypasses that convention.

3. **Treating "it imports fine" as "it belongs here"** — the fact that a function can be imported and called in a test file does not mean that file is the right home for those tests.

## Failure Pattern

Writing tests for a function in the package that consumes it rather than the package that owns it.

## Correct Solution

Tests for a function belong in the same package — and ideally the same file — as the function definition.

For the compiler package specifically:
- In-source tests live in the source file, guarded by `if (import.meta.vitest)`.
- When adding a new function to `packages/compiler/src/syntax/getBlockType.ts`, add its tests to the same file inside the existing `if (import.meta.vitest)` block.
- Do not add tests for compiler-package functions in editor-state or any other consuming package.

The general rule: before writing tests, identify which package owns the function and place the tests there.
