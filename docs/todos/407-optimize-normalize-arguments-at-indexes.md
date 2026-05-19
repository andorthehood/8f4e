---
title: 'TODO: Optimize normalizeArgumentsAtIndexes'
priority: Medium
effort: 1-3h
created: 2026-05-19
status: Open
completed: null
---

# TODO: Optimize normalizeArgumentsAtIndexes

## Problem Description

`normalizeArgumentsAtIndexes` maps every argument and calls `indexes.includes(index)` for each one. For memory array declarations, callers can pass many selected indexes, so this can become unnecessary repeated work during compile-time argument normalization.

The compiler coverage hotspot run showed this helper and its anonymous callbacks as high range-execution contributors.

## Proposed Solution

Avoid repeated `includes` checks over the selected index list. Options:
- Convert `indexes` to a `Set` before mapping.
- Iterate only selected indexes and copy the argument array lazily on the first change.
- Add a fast path for contiguous selected ranges used by memory declarations.

## Success Criteria

- [ ] Normalization produces identical AST output.
- [ ] Memory declaration normalization avoids avoidable nested scans.
- [ ] Compiler coverage logs show reduced `rangeExecutions` around normalization helpers.

## Affected Components

- `packages/compiler/src/semantic/normalization/helpers.ts`
- `packages/compiler/src/semantic/normalization/memoryDeclaration.ts`

