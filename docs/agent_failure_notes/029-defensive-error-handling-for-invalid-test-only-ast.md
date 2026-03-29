---
title: Agent Failure Note – Defensive error handling for invalid test-only AST
agent: Codex App Version 26.313.41514 (1043)
model: GPT-5.4 (medium)
date: 2026-03-28
---

# Agent Failure Note – Defensive error handling for invalid test-only AST

## Short Summary

I added defensive per-instruction error handling for malformed AST shapes that should only be possible from incorrect tests or internal misuse, not from real user input. That weakened the intended tokenizer -> semantic -> codegen contract instead of reinforcing the correct boundary.

## Original Problem

During PR follow-up, review comments pointed out that some instruction compilers could throw raw runtime errors if they received invalid AST nodes, for example missing identifier arguments in `function`, `module`, or `block`.

I accepted that framing too quickly and added local guards in instruction handlers, even though the actual architecture assumes:

- users cannot bypass the tokenizer
- tokenizer owns raw AST shape validity
- tests that manually construct AST must construct valid AST

The user explicitly called out that malformed hand-built test AST is not a real threat model and should not drive production compiler behavior.

## Anti-Patterns

Adding runtime guards in codegen/instruction compilers for states that are only reachable through bad tests.

Why this is wrong:

- it weakens the architectural boundary by making downstream code pretend invalid AST is expected
- it hides test bugs instead of fixing them
- it grows scattered defensive logic in places that should rely on earlier validated invariants
- it makes the compiler contract less clear: validated AST in, codegen out

```ts
const functionIdArg = line.arguments[0];
if (!functionIdArg || functionIdArg.type !== ArgumentType.IDENTIFIER) {
	throw getError(ErrorCode.MISSING_FUNCTION_ID, line, context);
}
```

The snippet looks reasonable in isolation, but it encodes the wrong ownership if invalid AST cannot come from real source input.

## Failure Pattern

Treating invalid internal test fixtures as a production input-validation problem.

## Correct Solution

Keep the boundary strict:

- tokenizer validates raw source and AST shape
- semantic pass validates semantic readiness
- codegen assumes validated input

If tests bypass the tokenizer and build AST directly, they must build valid AST or fail at the test layer. The right response is to fix those tests or introduce a single explicit compiler-entry AST validation layer only if arbitrary AST is a real supported input boundary.
