---
title: 'TODO: Replace serialized function type registry keys'
priority: Medium
effort: 2-4h
created: 2026-05-25
issue: https://github.com/andorthehood/8f4e/issues/688
status: Open
completed: null
---

# TODO: Replace serialized function type registry keys

## Problem Description

The function type registry currently deduplicates WebAssembly function signatures by creating a string key with `JSON.stringify({ params, results })` in `packages/compiler/src/instructionCompilers/functionEnd.ts`.

That works because JavaScript `Map` keys compare arrays and objects by identity rather than by structural value, but it is a poor internal contract for compiler-owned type identity. It serializes structured type data just to recover stable equality, and it makes the registry shape look looser than it really is.

The broader compiler hardening goal is to use strict internal types where applicable instead of handling ambiguity during runtime. Function type signatures are structured compiler data, so the registry should express that structure directly instead of encoding it through JSON serialization.

## Proposed Solution

Replace the serialized string key with an explicit typed function signature identity mechanism.

Possible approaches:

- Add a small `FunctionTypeKey` type and helper that encodes `params` and `results` without generic JSON serialization.
- Store typed signature records in `FunctionTypeRegistry` and use a structural equality helper to find an existing type index.
- Introduce a small registry API such as `getOrRegisterFunctionType(registry, signature)` so call sites do not manipulate `signatureMap` directly.

Prefer the approach that removes ad hoc serialization while keeping the registry simple and local to compiler internals.

## Implementation Plan

### Step 1: Centralize Type Registration

- Add a helper for registering or looking up a function type.
- Move the current key creation and `signatureMap` manipulation behind that helper.
- Keep `functionEnd` as the single registration point for user function signatures.

### Step 2: Replace JSON Serialization

- Replace `JSON.stringify({ params, results })` with a typed key/equality strategy.
- Update `FunctionTypeRegistry` in `packages/compiler-spec/src/compiled.ts` if its public shape needs to change.
- Avoid broadening types or adding runtime fallback checks just to preserve the existing map shape.

### Step 3: Keep Final Assembly Simple

- Preserve the current direction where `functionEnd` stores the registered `typeIndex` on function compilation state.
- Do not reintroduce a second signature serialization or registry lookup in `compileFunction`.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Check `rg -n "JSON.stringify\\(\\{ params, results \\}\\)|signatureMap\\.get\\(signature\\)" packages/compiler/src packages/compiler-spec/src`.

## Success Criteria

- [ ] Function type registry deduplication no longer relies on `JSON.stringify({ params, results })`.
- [ ] Function type identity is represented by typed compiler data or a dedicated registry helper.
- [ ] `functionEnd` remains the single registration point for function type indices.
- [ ] `compileFunction` continues to consume the registered `currentFunctionTypeIndex` directly.
- [ ] Compiler tests and typechecks pass.

## Affected Components

- `packages/compiler-spec/src/compiled.ts`
- `packages/compiler/src/instructionCompilers/functionEnd.ts`
- `packages/compiler/src/compiler.ts`
- function type registry tests or function-end compiler tests

## Risks & Considerations

- **Public shape risk**: `FunctionTypeRegistry` lives in `compiler-spec`; check whether changing `signatureMap` affects exported types or downstream package consumers.
- **Overengineering risk**: Avoid a large registry abstraction if a small typed helper is enough.
- **Wrong-goal risk**: Do not replace JSON serialization with another opaque string format unless it is clearly modeled as a typed key. The goal is to make signature identity explicit, not merely prettier.
- **Regression risk**: Function signatures with the same param/result types must still share one Wasm type entry and type index.

## Related Items

- **Follows**: `413-split-compiled-function-lifecycle-types.md`
- **Follows**: `414-split-compiler-context-phase-types.md`
