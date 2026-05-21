---
title: 'TODO: Expose compiler stack analysis results'
priority: Medium
effort: 4-8h
created: 2026-05-21
issue: null
status: Completed
completed: 2026-05-21
---

# TODO: Expose compiler stack analysis results

## Problem Description

The compiler now performs stack analysis before code generation, but the analysis result is only used internally. Editor features that want to explain the selected instruction cannot inspect the stack state that the compiler already computed.

This blocks richer instruction tooltips. The editor should eventually be able to show the current stack shape next to the selected line, including the stack before and after the instruction, consumed operands, and produced values.

## Proposed Solution

Add an explicit opt-in compiler option for returning stack analysis metadata:

```ts
includeStackAnalysis?: boolean;
```

When enabled, each compiled module and compiled function should expose stack analysis for its own compiled body:

```ts
result.compiledModules[moduleId].stackAnalysis
result.compiledFunctions?.[functionId].stackAnalysis
```

Keep this independent from `includeAST`. Callers should be able to request stack analysis without returning the full AST, and request the AST without returning stack analysis.

## Suggested Result Shape

Prefer a compact per-line debug payload instead of returning full analyzed AST lines:

```ts
type CompiledStackAnalysisLine = {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction: string;
	stackAnalysis: StackAnalysisResult;
};
```

Attach arrays to compiled outputs:

```ts
interface CompiledModule {
	stackAnalysis?: CompiledStackAnalysisLine[];
}

interface CompiledFunction {
	stackAnalysis?: CompiledStackAnalysisLine[];
}
```

## Implementation Plan

### Step 1: Add Public Types and Option

- Add `includeStackAnalysis?: boolean` to `CompileOptions`.
- Add a compact exported stack-analysis result type to `compiler-spec`.
- Add optional `stackAnalysis` fields to `CompiledModule` and `CompiledFunction`.

### Step 2: Collect Analysis During Compilation

- In `compileModule`, retain the `AnalyzedLine` returned by `analyzeInstruction` when `includeStackAnalysis` is enabled.
- In `compileFunction`, do the same for function bodies.
- Keep semantic-only and memory-declaration lines out of the result unless they receive meaningful stack-analysis records later.

### Step 3: Preserve Existing Payload Defaults

- Do not return stack analysis unless `includeStackAnalysis` is true.
- Do not require `includeAST` for stack analysis.
- Do not add stack analysis onto AST nodes by default.

### Step 4: Prepare Editor Consumption

- Make the payload easy to map by line number after macro expansion.
- Keep enough data for a selected-line tooltip to render:
  - stack before;
  - consumed operands;
  - produced values;
  - stack after;
  - dropped stack items where relevant.

## Validation Checkpoints

- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Add focused compiler tests for:
  - omitted `includeStackAnalysis` does not return analysis;
  - module stack analysis is returned when enabled;
  - function stack analysis is returned when enabled;
  - `includeAST` and `includeStackAnalysis` are independent.

## Success Criteria

- [x] `compile(...)` can return per-module stack analysis when requested.
- [x] `compile(...)` can return per-function stack analysis when requested.
- [x] Default compile output remains unchanged.
- [x] Stack analysis output is independent from AST output.
- [x] The payload contains enough line and stack metadata for editor selected-line tooltips.

## Completion Notes

Completed on 2026-05-21.

- Added `includeStackAnalysis?: boolean` to compiler options.
- Added `CompiledStackAnalysisLine` and optional `stackAnalysis` payloads for compiled modules and functions.
- Kept stack analysis opt-in and independent from `includeAST`.
- Added public compiler tests for omitted output, module output, function output, and combined AST plus stack analysis output.

## Affected Components

- `packages/compiler-spec/src/options.ts`
- `packages/compiler-spec/src/compiled.ts`
- `packages/compiler/src/compiler.ts`
- compiler public API tests
- future editor tooltip integration

## Risks & Considerations

- **Payload size**: stack analysis can be verbose, so keep it opt-in.
- **API shape**: expose a compact debug payload instead of leaking full compiler internals.
- **Line mapping**: tooltip consumers need stable line numbers, especially after macro expansion.
- **Future UI formatting**: stack values may need a presentation helper later, but this TODO should only expose the data.

## Related Items

- **Follows**: `397-finish-compiler-stack-analysis-codegen-separation.md`
- **Related**: selected-line instruction tooltip work in the editor
