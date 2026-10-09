---
title: Agent Failure Note - Preserving compiler contracts and snapshots during native assertions
agent: Codex
model: GPT-6
date: 2026-10-09
---

# Agent Failure Note - Preserving compiler contracts and snapshots during native assertions

## Short Summary

While adding native compiler assertions in PR #1003, the agent preserved an unused internal function-index override
and hid source identity in a companion map to avoid changing AST snapshots. Both decisions optimized for existing
tests rather than a simpler compiler representation.

## Original Problem

TODO 490 added `assert`, `assertEqual`, typed callback imports, and compiler-owned assertion source sites. Source
identity had to survive nested-group qualification and included-function renaming. Callback imports also had to be
accounted for before final function indices were used by code generation.

The agent added `ComposedProgram.sourceIdentities`, a `WeakMap` keyed by AST objects, instead of attaching original
names and group paths to the AST. Existing AST snapshots stayed unchanged because they did not serialize the map.

The agent also retained `startingFunctionIndex` in the private sub-program options and added a new regression test
for its interaction with assertions. A repository-wide caller search showed that only internal tests exercised the
override; the public compiler always compiled one whole program with compiler-owned indices.

The user requested a review for unnecessary contract preservation and clarified that this unreleased software can
change internal interfaces and tests directly.

## Anti-Patterns

- Keeping source provenance outside the AST solely to preserve its serialized shape.
- Treating existing internal tests as evidence that an unused option is a supported product requirement.
- Adding another test to entrench an obsolete contract instead of removing that contract and its tests.
- Applying compatibility caution without checking actual production callers or the user's scope.

Leaving runner migration for TODO 491 was an explicit scope decision. It did not require preserving obsolete
compiler internals or hiding new compiler metadata.

## Failure Pattern

Preserving tests and internal representations as if they were product requirements, even when the repository owns
every caller and the representation should change.

## Correct Solution

Store original source identity as ordinary enumerable AST metadata during composition, before renaming or
qualification loses it. Regenerate affected snapshots so reviewers can see the representation that later passes use.
Do not introduce hidden properties, companion maps, or snapshot filters to conceal the metadata.

Remove `startingFunctionIndex` and its tests. Use the shared compiler options and finalize indices uniformly after
planning all imports. Verify behavior through compiler/Wasm integration tests covering user imports, assertions,
defined functions, execution entries, and initialization exports.

Related incidents: [043](043-hidden-metadata-to-avoid-snapshot-updates.md),
[052](052-compatibility-layer-to-avoid-test-updates.md), and
[053](053-hidden-metadata-helper-to-avoid-snapshot-updates.md).
