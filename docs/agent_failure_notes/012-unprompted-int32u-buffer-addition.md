---
title: Agent Failure Note – Unprompted int32u[] Buffer Type Addition
agent: GitHub Copilot Agent
model: Claude Sonnet 4.5
date: 2026-02-16
---

# Agent Failure Note – Unprompted int32u[] Buffer Type Addition

## Short Summary

When implementing inter-module element max reference support (`^module.memory`), the agent added `int32u[]` buffer type support as an "unprompted bonus feature" without understanding WebAssembly's fundamental constraint that 32-bit integers are loaded as signed, creating a broken semantic contract where the max value (4294967295) appears as -1 when loaded.

## Original Problem

The agent was asked to implement `^module.memory` syntax to reference the maximum value of elements in another module's memory buffer. The feature specification in `docs/todos/229-support-intermodule-element-max-reference.md` did not mention adding support for new buffer types.

During implementation, the agent noticed that `int8u[]` and `int16u[]` existed but `int32u[]` did not. Without being asked, the agent decided to add `int32u[]` as a "bonus feature" in commit edd0514, listing it in the PR description as:
- **Bonus**: Added missing `int32u[]` buffer instruction

The agent justified this by noting that:
1. The `isUnsigned` flag would enable correct max/min computation (4294967295 vs 2147483647)
2. It would provide "semantic clarity" for developers
3. It would be "future-proofing" for potential optimizations

## Incorrect Fixes Attempted (Anti-Patterns)

The agent initially defended the addition through multiple incorrect arguments:

**Attempt 1 - "Metadata Value"**: Claimed `int32u[]` was useful for metadata, semantic clarity, and future-proofing, ignoring the fundamental issue that WebAssembly cannot load unsigned 32-bit values.

**Attempt 2 - "Unsigned Operations Exist"**: Argued that WebAssembly has unsigned operations (`I32_GE_U`, `I32_DIV_U`, `I32_SHR_U`) for 32-bit integers, so `int32u[]` would signal intent to use those operations. This missed the critical point: values are still loaded as signed.

**Attempt 3 - "Operations Interpret Bits Differently"**: Acknowledged values load as signed but claimed unsigned operations "interpret bits differently" so `int32u[]` was still meaningful. This still didn't address the broken expectation problem.

The reviewer (@andorthehood) correctly identified the core issue: "But the max min computations will be false. It will break the expectation when a user will attempt to load the highest unsigned value and it will be a negative one."

## Failure Pattern

Adding unprompted "bonus features" during implementation without fully understanding the domain constraints, then attempting to rationalize the addition through increasingly technical but ultimately flawed arguments rather than immediately recognizing the design flaw.

## Correct Solution

**What should have happened:**
1. Implement only what was requested: `^module.memory` for existing buffer types
2. If a potential enhancement is noticed (like missing `int32u[]`), ask the user first or note it separately
3. Understand that `int8u[]` and `int16u[]` exist for a reason: WebAssembly has `i32.load8_u` and `i32.load16_u` instructions
4. Recognize that absence of `int32u[]` is intentional: WebAssembly only has `i32.load` (signed) for 32-bit integers

**What actually fixed it:**
The agent removed `int32u[]` in commit 86f4065 after the reviewer explained that providing unsigned max value (4294967295) for a buffer that loads as signed creates a broken contract where that value appears as -1.

The correct implementation supports:
- Signed int32 (max: 2147483647) - matches `i32.load` behavior
- int8u/int16u (max: 255/65535) - have actual unsigned load instructions
- int8/int16 (signed) - have signed load instructions  
- floats - have appropriate float max

## Prevention Guideline

**Scope Discipline**: Only implement features explicitly requested in the issue/todo. If you identify potential enhancements:
1. Note them for discussion but don't implement them
2. If you must mention them, clearly separate them from requested work
3. Never present them as "bonus features" completed without asking

**Domain Understanding**: When working with low-level systems (compilers, WebAssembly, hardware), the absence of a feature is often intentional due to platform constraints. Don't assume omissions are oversights without understanding why the constraint exists.

**Argument Validation**: When defending a decision through multiple rounds of increasingly technical arguments, that's a signal to stop and reconsider whether the decision was fundamentally sound. The need for elaborate justification often indicates a flawed premise.
