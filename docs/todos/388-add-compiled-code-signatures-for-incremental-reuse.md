---
title: 'TODO: Add compiled code signatures for incremental reuse'
priority: Medium
effort: 2-4h
created: 2026-05-01
status: Open
completed: null
---

# TODO: Add compiled code signatures for incremental reuse

## Problem Description

The compiler worker needs a robust way to tell whether executable WebAssembly output changed between incremental compiles.

Current lightweight checks can use bytecode lengths, but length is only a proxy:
- same-length opcode changes can still alter behavior
- same-length literal encoding changes can still alter behavior
- module-level byte arrays should not be exposed to editor state just to support worker lifecycle decisions

## Proposed Solution

Generate an explicit compiled-code signature during compilation and use it for worker-side reuse decisions.

The signature should be deterministic for all executable output that affects the WebAssembly instance. A simple hash of the final `codeBuffer` is likely enough, but the implementation should decide whether a whole-program hash, per-module hashes, or both are useful.

## Implementation Plan

### Step 1: Define the signature contract
- Decide where the signature is produced: compiler return object or compiler worker wrapper.
- Decide whether the signature represents the whole `codeBuffer` only or also module/function subsets.

### Step 2: Use the signature in worker lifecycle logic
- Compare the current signature with the previous signature before reusing a WebAssembly instance.
- Keep memory recreation decisions based on memory layout and allocation metadata.

### Step 3: Keep editor-facing state metadata-only
- Do not reintroduce `cycleFunction`, `initFunctionBody`, or other module executable byte arrays into editor state to support reuse checks.

## Success Criteria

- [ ] Incremental instance reuse can detect same-length executable code changes.
- [ ] Memory reuse remains driven by memory layout, not executable bytecode shape.
- [ ] Editor-facing `compiledModules` remains metadata-only.
- [ ] Relevant compiler-worker tests cover changed and unchanged signatures.

## Affected Components

- `packages/compiler/src/index.ts` - possible source of a final compiled-code signature
- `packages/compiler-worker/src/compileAndUpdateMemory.ts` - incremental reuse and previous-signature storage
- `packages/compiler-worker/src/didProgramOrMemoryStructureChange.ts` - should remain memory/layout focused
- `packages/compiler-types/src/index.ts` - shared result type if the signature crosses package boundaries

## Related Items

- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`

## Notes

- `codeBuffer.length` can be useful as a temporary low-cost heuristic, but it is not enough for correct same-length change detection.
