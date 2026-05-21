---
title: Agent Failure Note - Gemini overdefensive review comments
agent: Gemini Code Assist
model: Gemini Code Assist
date: 2026-05-08
---

# Agent Failure Note - Gemini overdefensive review comments

## Short Summary

Gemini flagged PR #621 as losing validation and introducing stale-reference bugs, but the comments were invalid after checking supported compiler entry points and the actual normalization flow.

## Original Problem

The PR removed compiler-side argument validation from `withValidation` because tokenizer syntax validation now owns raw argument shape and arity checks.

Gemini reviewed the diff and claimed:
- `loop` and `#loopCap` lost non-negative integer validation.
- `#loopCap` lost its missing-argument check.
- `clampAddress` and `memoryCopy` had stale-reference bugs where resolved arguments would skip validation.

Those claims looked plausible from the diff alone because validation code disappeared from the compiler layer, but they ignored the tokenizer layer and the order of normalization.

## Anti-Patterns

- Reviewing removed defensive checks without checking whether ownership moved to an earlier phase.
- Treating internal compiler functions as adversarial entry points instead of validating through source parsing or another supported public entry point.
- Inferring a stale-reference mutation bug without confirming whether the helper mutates the argument array after the local variable is captured.
- Asking for more defensive normalization after the product path already rejects or validates the claimed bad states.

Why this is wrong:
- `loop` and `#loopCap` still have tokenizer-owned `nonNegativeIntegerLiteral` validation.
- `#loopCap` still has tokenizer-owned `minArguments: 1` validation.
- `normalizeArgumentsAtIndexes` resolves compile-time arguments before callers read `normalized.arguments[0]`.
- `validateOrDefer...` helpers do not mutate `normalized.arguments`; they defer unresolved intermodule cases or throw for unresolved identifiers/expressions.

## Failure Pattern

Diff-local review treated deleted validation as lost validation, then recommended extra defensive checks without proving a reachable product bug.

## Correct Solution

Use the review-comment validation workflow before accepting automated review findings.

For bug claims, test the supported entry point first:
- `loop 1.5` and `loop -1` should fail during syntax parsing.
- bare `#loopCap`, `#loopCap 1.5`, and `#loopCap -1` should fail during syntax parsing.
- `clampAddress WIDTH` with a resolved unsupported width should throw `INVALID_ACCESS_WIDTH`.
- `memoryCopy COUNT` with resolved float or negative constants should throw the appropriate compiler error.

If those paths behave correctly, respond that the automated review comment is invalid instead of adding redundant guards or reshaping ownership boundaries.

