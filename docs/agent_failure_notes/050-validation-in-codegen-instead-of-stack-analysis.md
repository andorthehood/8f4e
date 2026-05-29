---
title: Agent Failure Note - Validation in codegen instead of stack analysis
agent: Codex
model: GPT-5.5 (high)
date: 2026-05-10
---

# Agent Failure Note - Validation in codegen instead of stack analysis

## Short Summary

Codex fixed mixed float-width operands by adding checks to individual instruction codegen functions, even though the compiler already has a dedicated stack-analysis pass for operand validation.

## Original Problem

While fixing invalid Wasm emission for float64 comparison instructions, Codex added `hasMixedFloatWidth` guards directly inside compilers such as `equal`, `lessThan`, `greaterThan`, `lessOrEqual`, `greaterOrEqual`, and `greaterOrEqualUnsigned`.

That produced correct behavior locally, but it put validation in the wrong architectural layer. These instructions all use the shared `operandTypes: 'matching'` validation spec, and stack items already carry enough metadata to distinguish float32 from float64 before codegen runs.

## Anti-Patterns

- Fixing a reachable compiler bug at the point where invalid bytecode is emitted instead of checking which earlier pass owns the invariant.
- Duplicating the same semantic guard across many instruction compilers.
- Treating codegen as a defensive boundary for operand-shape validation.
- Adding unit tests around individual codegen guards when the real contract belongs to stack analysis.

Why this is wrong:
- Codegen should assume validated operands and focus on bytecode selection.
- The stack-analysis pass is the central place for operand count and operand type validation.
- Repeating the guard in each instruction risks drift when more `matching` instructions are added.
- The same rule also applies to arithmetic and min/max instructions, so a shared `matching` check is both smaller and more complete.

## Failure Pattern

Patching an invariant violation at the symptom layer instead of enforcing it at the compiler phase that owns the invariant.

## Correct Solution

Put mixed float-width rejection in `validateOperandTypes` for the `matching` operand rule:

```ts
if (hasMixedFloatWidth(...operands)) {
	throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
}
```

Then keep instruction compilers responsible only for choosing the correct opcode for already-valid operands, such as `F32_LT` vs `F64_LT`.

Tests should reflect the phase boundary:
- stack-analysis unit tests cover mixed float-width rejection for `matching`;
- public compiler-entry tests cover source-level mixed-width failures;
- codegen unit tests cover opcode selection for valid int, float32, and float64 operands.
