---
title: 'TODO: Track block context flags during stack analysis'
priority: Medium
effort: 2-4h
created: 2026-05-19
status: Open
completed: null
---

# TODO: Track block context flags during stack analysis

## Problem Description

`validateInstruction` checks whether each instruction is inside constants/map blocks by scanning the block stack. The internal compiler interfaces are still free to change, so this can be made cheaper by maintaining context flags or counters as block state changes.

The compiler coverage hotspot run showed repeated block-stack scans contributing to range executions.

## Proposed Solution

Extend the compilation context/block-stack handling with maintained flags or counters such as `insideConstantsBlock` and `insideMapBlock`. Update these when entering/exiting blocks, then make validation read the cached state instead of scanning the block stack for every instruction.

## Success Criteria

- [ ] Validation still rejects instructions in invalid block scopes.
- [ ] Block-stack mutation remains centralized enough that cached flags cannot drift.
- [ ] Compiler coverage logs show reduced `rangeExecutions` in stack validation and block-stack helpers.

## Affected Components

- `packages/compiler/src/stackAnalysis/validateInstruction.ts`
- `packages/compiler/src/utils/blockStack.ts`
- `packages/compiler/src/compiler.ts`
- `packages/compiler-spec` compilation context types

