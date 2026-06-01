---
title: Agent Failure Note - Internal API bypass paranoia
date: 2026-06-01
agent: Codex
model: GPT-5
---

# Agent Failure Note - Internal API Bypass Paranoia

## Short Summary

The agent added defensive fallbacks for callers bypassing an internal tokenizer API even though the project is unreleased and the user explicitly wanted internal APIs to break cleanly. The simple design was a parse-time flag; the agent turned it into compatibility handling and unrelated metadata plumbing.

## Original Problem

Prototype shape expansion needed a cheap module-level hint: while the project tokenizer is already reading module lines, it should set a flag when it encounters a `shape` instruction. Later compiler shape resolution should check that flag instead of scanning the whole module source again.

The user clarified that this was meant to happen in the tokenizer's main parsing loop:

```ts
let containsShape = false;

// while reading module lines:
if (isShapeInstructionLine(trimmed)) {
	containsShape = true;
}
```

Instead of keeping the change there, the agent kept a fallback helper that rescanned source:

```ts
containsShape: block.containsShape ?? containsShapeInstruction(block.code)
```

That was wrong. A bypassed internal API should fail or be updated, not get a hidden compatibility path.

## Anti-Patterns

- Adding fallbacks for hypothetical callers that bypass internal APIs.
- Treating tests and fixtures as compatibility clients instead of updating them to the new contract.
- Keeping an exported helper whose only job is to preserve the old scan-based behavior.
- Making metadata optional to avoid updating all call sites.
- Expanding a tokenizer/compiler metadata change into editor graphic data or persistence state.
- Using "conservative" behavior as an excuse to hide an incomplete migration.

## Failure Pattern

Protecting impossible or unsupported internal call paths after the user explicitly asked to break internal APIs and avoid compatibility shims.

## Correct Solution

Keep ownership narrow:

- The project tokenizer owns the parse-time `containsShape` flag.
- The compiler consumes the flag directly.
- Internal callers, tests, and fixtures must be updated to provide the new required metadata.
- Do not add fallback scans, compatibility helpers, or UI/editor metadata just in case something bypasses the tokenizer.

If a call path does bypass the tokenizer, treat that as a call-site migration problem. Fix the call site or let typecheck/tests expose it. Do not preserve the old behavior behind an optional field or fallback.
