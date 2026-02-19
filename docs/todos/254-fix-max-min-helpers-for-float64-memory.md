---
title: 'TODO: Fix max/min helpers for float64 memory'
priority: Medium
effort: 2-4h
created: 2026-02-19
status: Open
completed: null
---

# TODO: Fix max/min helpers for float64 memory

## Problem Description

`float64`, `float64*`, and `float64**` are being included in inter-module resolution paths, so `^module.memory` and `!module.memory` can target float64-backed memory items.

Today, `getElementMaxValue` / `getElementMinValue` return float32 finite limits for all non-integer memory items, regardless of element width.

That means float64 targets currently resolve to incorrect numeric bounds.

## Proposed Solution

Update max/min helper logic to branch on float element width:
- if `isInteger === false` and `elementWordSize === 8`, return float64 finite bounds
- if `isInteger === false` and `elementWordSize === 4`, keep current float32 bounds

Expected values:
- float64 max finite: `1.7976931348623157e308`
- float64 min finite: `-1.7976931348623157e308`

Keep integer and unsigned integer behavior unchanged.

## Anti-Patterns

- Do not change integer max/min behavior while fixing float handling.
- Do not return `Infinity`/`-Infinity`; use finite IEEE754 max values.
- Do not infer float64 from type name strings; use `elementWordSize`.

## Implementation Plan

### Step 1: Update helper logic
- Modify:
  - `/Users/andorpolgar/git/8f4e/packages/compiler/src/utils/memoryData.ts`
- Add explicit float-width branching in:
  - `getElementMaxValue`
  - `getElementMinValue`

### Step 2: Add focused tests
- Add/adjust tests in `memoryData.ts` in-source test block:
  - non-integer `elementWordSize: 4` -> float32 limits
  - non-integer `elementWordSize: 8` -> float64 limits
  - integer paths unchanged

### Step 3: Validate inter-module usage assumptions
- Run compiler tests covering `^module.memory` / `!module.memory` flows to ensure no regressions.

## Validation Checkpoints

- `rg -n "getElementMaxValue|getElementMinValue|elementWordSize" /Users/andorpolgar/git/8f4e/packages/compiler/src/utils/memoryData.ts`
- `npx nx run @8f4e/compiler:test -- --run "memoryData|push|intermodule|prefix"`

## Success Criteria

- [ ] Float64 memory items (`elementWordSize === 8`) return float64 finite max/min bounds.
- [ ] Float32 memory items (`elementWordSize === 4`) continue returning float32 finite max/min bounds.
- [ ] Integer and unsigned integer max/min behavior remains unchanged.
- [ ] Existing inter-module max/min reference tests continue to pass.

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/utils/memoryData.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests` (or in-source helper tests relying on max/min semantics)

## Risks & Considerations

- **Risk 1**: Accidentally broadening behavior for all float-like types.
  - Mitigation: gate strictly on `elementWordSize` and `isInteger`.
- **Risk 2**: Snapshot churn in tests that currently encode float32 bounds.
  - Mitigation: update only cases that are truly float64-backed.

## Related Items

- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/249-add-float64-allocation-support-on-4-byte-grid.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/250-add-f64-push-support.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/253-add-f64-support-for-basic-arithmetic.md`

## Notes

- This TODO is intentionally scoped to helper correctness and should land independently of broader float64 arithmetic work.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
