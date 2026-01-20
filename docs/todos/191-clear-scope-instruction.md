---
title: 'TODO: Add clearScope Instruction to Stack Config Compiler'
priority: Medium
effort: 1-2h
created: 2026-01-20
status: Open
completed: null
---

# TODO: Add clearScope Instruction to Stack Config Compiler

## Problem Description

The stack config language can reset scope using `rescope` with an empty path, but that intent is implicit. We want an explicit instruction name that communicates “reset scope to root” to improve readability in config blocks.

## Proposed Solution

Introduce a `clearScope` instruction that resets the scope stack to root (empty). It should behave like `rescope ""` but be explicit and documented.

## Implementation Plan

### Step 1: Add instruction support
- Add `clearScope` to the parser command list and command type union.
- Implement execution behavior in the VM (clear scope stack, reset scope-specific constants).

### Step 2: Add tests
- Parser test for `clearScope`.
- VM/compile test confirming scope stack is empty and constants reset.

### Step 3: Update documentation
- Document the new instruction in `packages/stack-config-compiler/README.md` with examples.

## Success Criteria

- [ ] `clearScope` parses as a valid command.
- [ ] Executing `clearScope` resets scope to root and clears scope-specific constants.
- [ ] Documentation includes the new command and example usage.

## Affected Components

- `packages/stack-config-compiler/src/parser/parseLine.ts`
- `packages/stack-config-compiler/src/types.ts`
- `packages/stack-config-compiler/src/vm/executeCommand.ts`
- `packages/stack-config-compiler/src/commands` (new command or reuse existing rescope logic)
- `packages/stack-config-compiler/README.md`

## Risks & Considerations

- **Behavior parity**: Ensure `clearScope` matches `rescope ""` semantics for constants cleanup.
- **Compatibility**: No breaking change; additive instruction only.

## Related Items

- **Related**: TODO 190 (stack-config empty array append syntax), TODO 173 (scoped constants)

## Notes

- Could be implemented as a thin wrapper around `rescope` with empty segments.
