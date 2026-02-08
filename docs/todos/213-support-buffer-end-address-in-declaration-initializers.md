---
title: 'TODO: Support buffer& End Address in Declaration Initializers'
priority: Medium
effort: 2-4h
created: 2026-02-08
status: Open
completed: null
---

# TODO: Support buffer& End Address in Declaration Initializers

## Problem Description

Declaration initializers currently collapse both `&buffer` and `buffer&` to the same start address when parsing memory-reference defaults (for example `int foo buffer&`). This makes end-address syntax inconsistent between `push` and declaration initialization and can silently produce wrong pointer defaults.

## Proposed Solution

Update declaration argument parsing so memory-reference defaults preserve start-vs-end semantics:
- `&name` resolves to `byteAddress`
- `name&` resolves to the last byte address of the memory item

Use the same semantic split already used by `push` to keep behavior consistent across instructions.

## Implementation Plan

### Step 1: Update declaration default parsing
- In `packages/compiler/src/utils/memoryInstructionParser.ts`, branch memory-reference handling by prefix/suffix instead of always using `memoryItem.byteAddress`.
- Reuse existing syntax helpers (`hasMemoryReferencePrefixStart`/end checks) and memory address utilities.

### Step 2: Add targeted tests
- Extend `packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts` with a `buffer&` case that expects end address resolution.
- Keep existing `&buffer` assertions to verify no regression.

### Step 3: Align docs
- Update compiler docs to explicitly state declaration initializer support for both forms and their meanings.

## Success Criteria

- [ ] `int foo &buffer` resolves to buffer start byte address.
- [ ] `int foo buffer&` resolves to buffer end byte address.
- [ ] `parseMemoryInstructionArguments` tests cover both forms and pass.
- [ ] Docs describe both initializer forms unambiguously.

## Affected Components

- `packages/compiler/src/utils/memoryInstructionParser.ts` - Declaration default value resolution.
- `packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts` - Parser behavior coverage.
- `packages/compiler/docs/prefixes.md` - Language semantics docs.

## Risks & Considerations

- **Risk**: Behavior change for users who relied on current `buffer&` bug.
- **Mitigation**: Keep change scoped, add explicit tests and docs, and mention in changelog/release notes if needed.

## Related Items

- **Related**: `docs/todos/146-investigate-index-arithmetic-support.md`
- **Related**: `docs/todos/212-remove-init-loop-distinction-from-compiler.md`

