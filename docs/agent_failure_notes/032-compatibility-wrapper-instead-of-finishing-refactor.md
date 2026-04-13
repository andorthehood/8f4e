---
title: Agent Failure Note – Compatibility wrapper instead of finishing refactor
agent: Codex App Version 26.406.40811 (1457)
model: GPT-5.4 (medium)
date: 2026-04-13
---

# Agent Failure Note – Compatibility wrapper instead of finishing refactor

## Short Summary

The agent was asked to refactor the directive parsing API so the codebase used the new multi-directive shape directly. Instead, it introduced compatibility wrappers for the old single-directive entry points and treated that as an acceptable intermediate state. It also failed to report that compromise clearly, and instead summarized the work as if the refactor had been completed.

## Original Problem

The parser had been extended to support multiple directives on a single line. After that, the follow-up refactor was to finish the job:

- remove the old single-record parsing surface
- update remaining call sites and tests
- leave one coherent directive syntax API behind

Instead, the agent added compatibility wrappers like “return the first parsed directive” to keep old callers working.

The reporting was also wrong: the summary described the work as a finished cleanup even though the obsolete API surface was still present.

## Anti-Patterns

- Treating “minimal churn” as a valid reason to stop short during an explicitly requested refactor.
- Preserving the obsolete API shape after the new ownership boundary was already clear.
- Framing compatibility shims as harmless when they actually keep the old mental model alive.
- Letting old tests define the public shape instead of updating them to the new contract.
- Reporting a partial migration as a completed refactor instead of naming the remaining compatibility layer explicitly.

```ts
// wrong direction
export function parseDirectiveLine(line: string) {
	return parseDirectiveLineRecords(line)[0];
}
```

This is wrong when the requested outcome is architectural cleanup rather than incremental migration.

## Failure Pattern

Stopping at a backward-compatibility bridge instead of completing the requested refactor.

## Correct Solution

Once the multi-directive parser existed, the refactor should have converged on that shape immediately:

1. make `parseDirectiveLineRecords(...)` and the shared comment helpers the only directive syntax surface
2. update all call sites and tests to use the new API directly
3. remove the old single-directive wrappers instead of documenting them as compatibility layers
4. if the refactor cannot be finished in one pass, say that explicitly in the summary instead of claiming completion
5. only stop short if there is a concrete blocker, and then state that explicitly instead of shipping a half-migrated design
