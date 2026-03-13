---
title: Agent Failure Note – Compatibility shim added instead of completing repo-wide rename
agent: Codex App Version 26.305.950 (863)
model: gpt-5.4 (medium)
date: 2026-03-14
---

# Agent Failure Note – Compatibility shim added instead of completing repo-wide rename

## Short Summary

The agent introduced a compatibility shim to preserve old field access during an internal rename, even though the repository fully owned all affected code and tests. That made the model less explicit and delayed the real migration work instead of completing it.

## Original Problem

The task was to rename macro-related AST line number fields so the compiler clearly distinguished:

- `lineNumberBeforeMacroExpansion`
- `lineNumberAfterMacroExpansion`

Instead of updating all source, tests, and snapshots immediately, the agent first added fallback helper logic that still accepted the old `lineNumber` field.

That let partially migrated code continue to work, but it was the wrong choice.

## Anti-Patterns

1. Adding a backward-compatibility layer to avoid fixing all call sites during a repo-wide rename.
2. Using fallback logic to keep old tests passing instead of updating fixtures and snapshots explicitly.
3. Preserving an obsolete field shape in helper functions after deciding on better names.

Why this is wrong:
- It blurs the new domain model right after it was clarified.
- It hides incomplete migration work behind permissive helper behavior.
- It increases the chance of old and new naming schemes coexisting indefinitely.
- It optimizes for short-term test stability instead of architectural clarity.

```ts
export function getLineNumberBeforeMacroExpansion(line: LineNumberCarrier): number {
	return line.lineNumberBeforeMacroExpansion ?? line.lineNumberAfterMacroExpansion ?? line.lineNumber ?? 0;
}
```

The fallback to `lineNumber` was the mistake. Once the rename was chosen, all internal references should have been migrated.

## Failure Pattern

Treating a fully owned internal rename like a public API migration.

## Correct Solution

When the repository owns all code and the rename is intentional:

- rename the fields everywhere,
- update all source call sites,
- update test fixtures and snapshots,
- and remove the old names completely in the same change.

Do not add compatibility shims just to reduce migration work or avoid temporary test breakage. In this case the correct path was to complete the rename end to end and let any missed references fail loudly until fixed.
