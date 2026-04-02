---
title: 'TODO: Replace isPointingToInt8/isPointingToInt16 booleans with a single pointeeBaseType field'
priority: Low
effort: 2-4h
created: 2026-04-02
status: Open
completed: null
---

# TODO: Replace isPointingToInt8/isPointingToInt16 booleans with a single pointeeBaseType field

## Problem Description

- `DataStructure` currently uses individual boolean flags (`isPointingToInt8`, `isPointingToInt16`) to encode the pointee's base type for narrow pointer types.
- Each new narrow pointer type (e.g. `int8u*`, `int16u*`) would require yet another boolean on `DataStructure`, another branch in `getMemoryFlags`, `pushMemoryPointer`, `getPointeeElementWordSize`, `getPointeeElementMaxValue`, and every other consumer.
- This pattern is already showing signs of strain with two narrow types; it will not scale.

## Proposed Solution

Replace all `isPointingToIntN` booleans with a single optional field on `DataStructure`:

```ts
pointeeBaseType?: 'int' | 'int8' | 'int8u' | 'int16' | 'int16u' | 'float' | 'float64';
```

Consumers switch on this field instead of checking multiple booleans:

- `pushMemoryPointer`: select load opcode from a map keyed by `pointeeBaseType`.
- `getPointeeElementWordSize`: look up byte width from `pointeeBaseType`.
- `getPointeeElementMaxValue`: look up max from `pointeeBaseType`.
- `getMemoryFlags`: set `pointeeBaseType` instead of individual booleans.

This also makes it trivial to add `int8u*`, `int16u*`, or future narrow types without touching the type definition.

## Implementation Plan

### Step 1: Add `pointeeBaseType` to `DataStructure`
- Add the optional field to the interface in `types.ts`.
- Keep the old booleans temporarily for a smooth migration.

### Step 2: Populate `pointeeBaseType` in `getMemoryFlags`
- Set it based on `baseType` and `pointerDepth`.
- Continue emitting the old booleans so nothing breaks.

### Step 3: Migrate consumers to read `pointeeBaseType`
- `pushMemoryPointer` — replace `isPointingToInt8` / `isPointingToInt16` checks with a single lookup.
- `getPointeeElementWordSize` — derive byte width from `pointeeBaseType`.
- `getPointeeElementMaxValue` — derive max value from `pointeeBaseType`.
- Update any runtime or editor-state code that checks the old flags.

### Step 4: Remove old booleans
- Delete `isPointingToInt8` and `isPointingToInt16` from `DataStructure`.
- Remove them from `getMemoryFlags` return value.
- Update all tests.

## Success Criteria

- [ ] `DataStructure` has no `isPointingToIntN` booleans; `pointeeBaseType` is the single source of truth.
- [ ] Adding a new narrow pointer type requires only: adding the type string to the union, a declaration compiler, and entries in lookup tables — no new booleans.
- [ ] All existing tests pass.

## Affected Components

- `packages/compiler/src/types.ts` — `DataStructure` interface
- `packages/compiler/src/utils/memoryFlags.ts` — flag generation
- `packages/compiler/src/utils/memoryData.ts` — pointee metadata queries
- `packages/compiler/src/instructionCompilers/push/handlers/pushMemoryPointer.ts` — load opcode selection
- `packages/compiler/src/semantic/declarations/int8.ts` — int8 pointer compiler
- `packages/compiler/src/semantic/declarations/int16.ts` — int16 pointer compiler

## Risks & Considerations

- **Low risk**: This is a pure internal refactor; the compilation output and memory layout are unchanged.
- **No fallback logic needed**: The software has not been released and we own the entire pipeline, so breaking internal APIs is fine. Remove the old booleans in one pass — no deprecation shims or backward-compatibility wrappers.
- **Test churn**: Many in-source tests construct `DataStructure` literals with the old booleans — they all need updating in one pass.

## Notes

- The current boolean approach was inherited from the int16* implementation (TODO #324) and extended for int8* support.
- This refactor becomes more valuable if/when `int8u*` or `int16u*` are added.
