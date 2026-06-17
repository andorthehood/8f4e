---
title: 'TODO: Refactor stack analyzer to return fact report'
priority: Medium
effort: 1-2d
created: 2026-06-17
issue: null
status: Completed
completed: 2026-06-17
---

# TODO: Refactor Stack Analyzer to Return Fact Report

## Problem Description

The compiler is moving toward a pipeline where the tokenizer creates the AST and all later passes leave that AST
unchanged. Analysis and resolution passes should return separate report objects containing the facts they discover.

The stack analyzer is now the main pass that still blurs that boundary. It receives semantic-reference facts and then
returns `analyzedLines` that are enriched line objects. It also records some information by mutating shared or derived
objects during analysis:

- call analysis attaches `targetFunction` to call lines;
- call analysis marks `FunctionMetadata.used = true`;
- local pointer metadata can be enriched through mutable local binding objects;
- codegen consumes these enriched analyzed lines rather than a fully separate report.

This keeps codegen convenient, but it means stack analysis facts are not cleanly separated from AST-shaped data.

## Proposed Solution

Refactor `@8f4e/stack-analyzer` so it returns a dedicated stack-analysis fact report keyed back to the original AST and
semantic-reference report.

The stack analyzer should not mutate AST lines, semantic-reference lines, or shared function metadata. It should return
all downstream information explicitly.

The report should include at least:

- per-module and per-function line facts keyed by line index;
- stack before/after, consumed operands, produced stack items, and dropped stack items;
- resolved call targets keyed by function id plus line index;
- used function ids as an explicit set/list rather than `FunctionMetadata.used = true`;
- final function locals and parameter counts;
- import/export facts currently surfaced through function compilation context;
- any local pointer enrichment needed by codegen.

Codegen should consume `ast + semanticReferenceReport + stackAnalysisReport` and derive the line view it needs locally,
without relying on stack-analyzer-mutated line objects. This todo is not complete until the consumer side is updated to
the new report contract directly.

## Anti-Patterns

- Do not keep `analyzedLines` as a compatibility shim while also adding a new report.
- Do not add transitional adapters that recreate the old enriched-line API.
- Do not stop after changing stack-analyzer output while leaving codegen or compiler orchestration on the old shape.
- Do not mutate `FunctionMetadata.used`.
- Do not attach `targetFunction`, `stackAnalysis`, or local pointer facts directly to AST/semantic line objects.
- Do not preserve old import paths or type aliases just to avoid updating compiler/codegen call sites.
- Do not add fallback reads from both old and new fields.

The software has not been released, so internal and external contracts may break. Finish the refactor in the desired
shape instead of preserving compatibility.

## Implementation Plan

### Step 1: Define the Stack Analysis Report Contract

- Add target-neutral report types in `@8f4e/language-spec` only if they are shared across packages.
- Keep stack-analyzer-specific implementation details inside `@8f4e/stack-analyzer`.
- Decide the exact keying strategy for line facts: module/function id plus line index is preferred.
- Model used functions as explicit `usedFunctionIds`.

### Step 2: Stop Mutating Function Metadata and Lines

- Update call analysis to return the resolved target function id/index as a line fact.
- Remove `targetFunction` mutation from analyzed call lines.
- Remove `FunctionMetadata.used = true` mutation.
- Return local pointer enrichment as function/local facts instead of mutating shared local objects.

### Step 3: Update Codegen to Consume Reports

- Change `@8f4e/wasm-codegen` to receive stack-analysis facts instead of enriched analyzed lines.
- Build any per-line codegen view locally from AST, semantic-reference facts, and stack facts.
- Update `packages/compiler/src/compileSubProgram.ts` and any package public APIs in the same refactor so the new
  report contract is the only path between producer and consumer.
- Keep codegen mutation limited to backend emission context and bytecode output.

### Step 4: Remove Old Shapes

- Delete `analyzedLines` from stack-analyzer public results if it only exists to preserve old codegen behavior.
- Remove old enriched-line types and tests.
- Remove any now-unused fields from language-spec, especially fields that only existed to carry stack-analysis output on
  AST-shaped lines.

## Validation Checkpoints

- `rg -n "targetFunction|\\.used\\s*=|analyzedLines|stackAnalysis:" packages/compiler/packages/stack-analyzer packages/compiler/packages/wasm-codegen packages/compiler/src`
- `npx nx run @8f4e/stack-analyzer:test`
- `npx nx run @8f4e/stack-analyzer:typecheck`
- `npx nx run @8f4e/wasm-codegen:test`
- `npx nx run @8f4e/wasm-codegen:typecheck`
- `npx nx run @8f4e/compiler:test`
- `npx nx run @8f4e/compiler:typecheck`

## Success Criteria

- [x] Stack analyzer does not mutate AST lines or semantic-reference lines.
- [x] Stack analyzer does not mutate `FunctionMetadata.used`.
- [x] Stack analyzer returns explicit per-line stack facts and call target facts.
- [x] Codegen and compiler orchestration consume stack facts by key instead of enriched analyzed line objects.
- [x] No compatibility shims, transitional re-exports, fallback fields, or old API adapters remain.
- [x] Existing compiler/codegen behavior is preserved by tests after call site updates.

## Affected Components

- `packages/compiler/packages/stack-analyzer` - owns the new stack-analysis report and removes enriched line output.
- `packages/compiler/packages/wasm-codegen` - consumes stack facts and semantic-reference facts directly.
- `packages/compiler/packages/language-spec` - may lose or rename AST-shaped analysis types.
- `packages/compiler/src/compileSubProgram.ts` - remains the orchestrator wiring reports between passes.

## Risks & Considerations

- **Line keying**: line index is stable inside an AST block, but source line number is better for diagnostics. Prefer
  storing both when useful.
- **Codegen ergonomics**: codegen may need a small local read model over AST plus reports. That read model should not be
  exported as a compatibility layer.
- **Function reachability**: replacing `FunctionMetadata.used` may affect emitted function filtering. Make used-function
  facts explicit and test imported, exported, directly called, and inline-argument call cases.
- **Local pointer facts**: local pointer enrichment must remain available to later memory operations without mutating
  shared local bindings.

## Related Items

- **Related**: `docs/brainstorming_notes/050-immutable-compiler-pass-reports.md`
- **Related**: PR #823, which extracted semantic reference resolution into a standalone report-producing pass.
