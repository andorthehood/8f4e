---
title: 'TODO: Extract shared module memory identifier parser'
priority: Medium
effort: 2-4h
created: 2026-03-14
status: Open
completed: null
---

# TODO: Extract shared module memory identifier parser

## Problem Description

The codebase currently parses `module.memory` identifiers in multiple places with slightly different local logic.

Current behavior:
- [packages/runtime-audio-worklet/src/runtimeDef.ts](/Users/andorpolgar/git/8f4e/packages/runtime-audio-worklet/src/runtimeDef.ts) parses audio buffer bindings using a local helper and repeated `split('.')` calls
- [packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts](/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts) reparses inter-module identifiers inline
- [packages/editor/packages/editor-state/src/pureHelpers/resolveBinaryAssetTarget.ts](/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/pureHelpers/resolveBinaryAssetTarget.ts) performs another local split
- compiler syntax helpers such as `extractIntermodularElement*Base.ts` also repeat the same structural parsing pattern

Why this is a problem:
- parsing behavior can drift across packages
- repeated `split('.')` calls and regex checks add avoidable duplication
- edge-case handling becomes harder to reason about because the parsing contract is not centralized

Impact:
- medium maintenance cost from duplicated parsing rules
- avoidable bugs when one call site accepts or rejects shapes differently from another
- small but easy cleanup opportunity across runtime/editor/compiler code

## Proposed Solution

Introduce one shared helper for parsing unified inter-module memory identifiers and use it consistently where the code only needs the `moduleId` and `memoryName` pair.

High-level approach:
- add a small helper such as `parseModuleMemoryIdentifier(value)` that returns `{ moduleId, memoryName } | undefined`
- keep the helper narrowly scoped to the `module.memory` format
- refactor call sites to use the helper instead of local regex-plus-split logic

Possible implementation shape:
- place the helper in a small shared utility location that can be consumed by editor/runtime code
- if compiler syntax helpers need stricter behavior, either reuse the same helper directly or build a thin syntax-specific wrapper around it
- standardize on one validation rule for malformed identifiers

## Anti-Patterns

- Do not fold pointer syntax, address operators, or buffer index parsing into the shared helper.
- Do not broaden the helper into a generic expression parser.
- Do not change accepted `module.memory` syntax as part of this cleanup.
- Do not duplicate the helper under separate package-specific names.

## Implementation Plan

### Step 1: Add the shared parser
- Create a small helper that parses `module.memory` into `moduleId` and `memoryName`
- Keep failure behavior explicit and simple

### Step 2: Refactor editor/runtime call sites
- Update `resolveMemoryIdentifier.ts`, `resolveBinaryAssetTarget.ts`, and `runtimeDef.ts`
- Remove repeated `split('.')` and local regex checks where the shared helper is sufficient

### Step 3: Review compiler-side parsing overlap
- Identify compiler helpers that are duplicating the same structural split
- Reuse the helper directly where possible, or keep a thin compiler-specific wrapper if syntax-layer responsibilities require it

### Step 4: Add focused tests
- Cover valid identifiers
- Cover malformed inputs with missing module or memory segments
- Verify current consuming call sites preserve behavior after refactor

## Validation Checkpoints

- `rg -n "split\\('\\.'\\)|module\\.memory|resolveAudioBufferMemory|resolveBinaryAssetTarget|extractIntermodularElement" packages src`
- `npx nx run editor-state:test`
- `npx nx run runtime-audio-worklet:typecheck`
- `npx nx run compiler:test`

## Success Criteria

- [ ] `module.memory` parsing is centralized in one shared helper or one shared helper plus a thin syntax wrapper.
- [ ] Editor and runtime call sites no longer duplicate the same regex-plus-split logic.
- [ ] Behavior for valid and invalid identifiers remains consistent.
- [ ] Tests cover malformed and well-formed identifiers.

## Affected Components

- `packages/runtime-audio-worklet/src/runtimeDef.ts` - current local audio buffer memory parsing
- `packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts` - current inline inter-module parsing
- `packages/editor/packages/editor-state/src/pureHelpers/resolveBinaryAssetTarget.ts` - current local split logic
- `packages/compiler/src/syntax/extractIntermodularElement*.ts` - possible compiler-side overlap

## Risks & Considerations

- **Boundary confusion**: compiler syntax helpers may need to preserve syntax-layer ownership even if they reuse the same low-level split helper.
- **Overreach**: this should stay a small parser extraction, not a larger memory-identifier redesign.
- **Behavior drift**: malformed-input handling must be checked carefully so editor/runtime behavior does not change accidentally.

## Related Items

- **Related**: `docs/todos/307-optimize-state-manager-selector-tokenization-and-subscription-lookup.md`

## Notes

- This is mainly a consistency and maintainability cleanup with a small optimization side benefit.
- The helper should remain extremely small and easy to inline mentally.
