---
title: 'TODO: Add float promote/demote instructions'
priority: Medium
effort: 1-2d
created: 2026-02-19
status: Open
completed: null
---

# TODO: Add float promote/demote instructions

## Problem Description

With `float32` and `float64` both present in the type system, we need explicit conversions between them.

Today, mixed-width float operations are expected to fail validation, which is good for safety, but there is no explicit user-level way to intentionally convert widths.

## Proposed Solution

Add two explicit instructions:
- `promoteToFloat64` -> emits `f64.promote_f32`
- `demoteToFloat32` -> emits `f32.demote_f64`

Scope:
- compiler instruction parsing/validation/codegen,
- stack type metadata update after conversion,
- tests and docs.

Out of scope:
- implicit auto-promotion in arithmetic instructions,
- non-float conversion instructions (int<->float widening/truncation additions).

## Anti-Patterns

- Do not silently auto-cast mixed float operations.
- Do not overload existing `castToFloat` semantics in a way that hides width changes.

## Implementation Plan

### Step 1: Add instruction compilers
- Add instruction compiler modules for `promoteToFloat64` and `demoteToFloat32`.
- Validate operand type before emission:
  - `promoteToFloat64` requires `float32`
  - `demoteToFloat32` requires `float64`

### Step 2: Wire instructions and stack typing
- Register both instructions in instruction index.
- Update stack item typing so result type becomes `float64` or `float32` respectively.

### Step 3: Add tests and docs
- Add compiler tests for valid and invalid operand types.
- Add snapshots asserting `f64.promote_f32` and `f32.demote_f64`.
- Document instruction behavior in compiler docs.

## Validation Checkpoints

- `rg -n "promoteToFloat64|demoteToFloat32|promote_f32|demote_f64" /Users/andorpolgar/git/8f4e/packages/compiler`
- `npx nx run @8f4e/compiler:test -- --run "promote|demote|cast|float"`

## Success Criteria

- [ ] `promoteToFloat64` compiles to `f64.promote_f32` with strict type checks.
- [ ] `demoteToFloat32` compiles to `f32.demote_f64` with strict type checks.
- [ ] Stack metadata reflects converted float width after each instruction.
- [ ] Mixed-width arithmetic still fails unless conversion is explicit.

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers` - new instruction compilers and registry entries.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/wasmUtils/wasmInstruction.ts` - opcodes if not already present.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/types.ts` and validation helpers - width-aware stack typing.
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests` - instruction tests/snapshots.

## Risks & Considerations

- **Risk 1**: Confusion with existing cast instruction naming.
  - Mitigation: keep names explicit (`promote`/`demote`) and document operand requirements.
- **Risk 2**: Accidental relaxation of mixed-width validation.
  - Mitigation: preserve explicit-error tests for uncast mixed-width operations.

## Related Items

- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/250-add-f64-push-support.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/249-add-float64-allocation-support-on-4-byte-grid.md`

## Notes

- Keep conversion explicit at instruction level to avoid hidden precision/behavior changes.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
