---
title: Agent Failure Note – storeBytes Order Semantics Mismatch (Push Order vs Pop Order)
agent: GitHub Copilot Agent
model: Claude Sonnet 4.6
date: 2026-02-23
---

# Agent Failure Note – storeBytes Order Semantics Mismatch (Push Order vs Pop Order)

## Short Summary

The agent implemented `storeBytes` with push-order-preserving behavior (including reversal-oriented logic), while the user’s intended behavior was natural pop order (top-of-stack first to `dst + 0`). This introduced unnecessary complexity and incorrect semantics.

## Original Problem

The user requested simplification and explicitly clarified they did **not** want push-order preservation in memory writes.

Desired behavior:
- top-of-stack byte -> `dst + 0`
- next pop -> `dst + 1`
- and so on

Implemented behavior retained push-order mapping through reorder/reverse handling and complex local-variable choreography.

## Anti-Patterns

- Preserving prior interpretation (“push order”) after user clarified different semantics.
- Optimizing around an incorrect requirement instead of re-validating contract.
- Keeping indirect reorder logic (`reverse`/re-push/localSet sequencing) when a direct mapping is required.
- Allocating one temporary local per stack byte item (`__storeBytesByte*`), which scales linearly in generated locals/code size and is unnecessary for direct store emission.
- Performing compiler-side re-push and compensating stack-pop bookkeeping to reconcile `compileSegment` side effects, instead of keeping a single-pass consume/write flow.
- Overfitting implementation to helper mechanics (`compileSegment` + synthetic locals) rather than the instruction’s minimal semantic contract.

## Failure Pattern

Continuing implementation around an outdated semantic assumption after explicit user correction.

## Correct Solution

1. Treat user clarification as authoritative and update instruction contract immediately.
2. Implement `storeBytes` as direct pop-order writes:
   - pop byte 0 -> store at `dst + 0`
   - pop byte 1 -> store at `dst + 1`
3. Remove reverse/reorder logic and avoid per-byte temporary locals where possible.
4. Keep stack tracking straightforward: consume operands once, no compensating bookkeeping passes.
5. Prefer minimal temporaries (destination address, optional current byte) and emit stores directly so complexity remains stable as `count` grows.
