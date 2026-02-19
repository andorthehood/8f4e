---
title: 'TODO: Add f64 literal suffix support'
priority: Medium
effort: 1-2d
created: 2026-02-19
status: Completed
completed: 2026-02-19
---

# TODO: Add f64 literal suffix support

## Problem Description

As float64 support expands, numeric literals like `3.14` are width-ambiguous in push contexts.

Today, float literal parsing does not provide an explicit way to request a float64 constant directly, which makes `push` codegen under-specified for 64-bit constants.

## Proposed Solution

Add explicit float literal suffix parsing for 64-bit constants:
- `3.14f64`
- `1e-10f64`
- `-42.0f64`

Optional (same TODO or follow-up decision):
- `f32` suffix support (`3.14f32`) for symmetry and readability.

Core behavior:
- Unsuffixed float literals keep current default behavior.
- `f64` suffixed literals are parsed and typed as float64 values.
- `push` emits `f64.const` for `f64` suffixed literals.
- `const` declarations preserve `f64` width metadata so constants can be consumed as float64 in downstream usage.

## Anti-Patterns

- Do not infer float width from digit count or decimal precision.
- Do not silently reinterpret existing unsuffixed literals as float64.
- Do not accept malformed suffix forms (`3.14F64`, `3.14 f64`, `3.14ff64`) unless explicitly specified.

## Implementation Plan

### Step 1: Extend argument parser shape
- Update argument parsing to recognize `f64`-suffixed numeric literals.
- Preserve existing literal handling for int/float32 defaults.
- Extend literal type metadata to carry explicit float width when suffix is present.

### Step 2: Wire compiler push/codegen behavior
- Update push resolver/routing so `f64` literal metadata maps to `f64.const`.
- Ensure `const` declaration parsing/collection preserves suffix-derived width metadata (for example `const PI 3.141592653589793f64`).
- Ensure pushing/using `f64` constants resolves through the float64 path.
- Ensure unsuffixed literals still follow existing behavior.

### Step 3: Add tests and docs
- Add parser tests for valid/invalid `f64` suffix forms.
- Add compiler tests/snapshots confirming `f64.const` emission.
- Add constants-block tests ensuring `f64`-suffixed const values are stored with float64 typing and emitted correctly when pushed.
- Update language docs with suffix syntax and examples.

## Validation Checkpoints

- `rg -n "f64|suffix|parseArgument|ArgumentLiteral|push" /Users/andorpolgar/git/8f4e/packages/compiler/src`
- `npx nx run @8f4e/compiler:test -- --run "parseArgument|push|float"`
- Confirm snapshots include `f64.const` for suffixed literals.

## Success Criteria

- [ ] Parser accepts valid `f64`-suffixed numeric literals and rejects malformed forms.
- [ ] Literal metadata distinguishes float64 suffix literals from default float literals.
- [ ] `push` emits `f64.const` for `f64` suffix literals.
- [ ] `const` values defined with `f64` suffix preserve float64 typing and emit float64 codegen when used.
- [ ] Existing unsuffixed literal behavior remains unchanged.

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/syntax/parseArgument.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/types.ts` (literal metadata shape if needed)
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/push.ts` (or push resolver helper)
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/astUtils/collectConstants.ts` and constant resolution paths
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests`
- compiler docs for literal syntax

## Risks & Considerations

- **Risk 1**: Parser compatibility regressions for existing numeric forms.
  - Mitigation: preserve current parse branches and add regression tests for all old literal types.
- **Risk 2**: Inconsistent suffix behavior across parser and codegen.
  - Mitigation: assert parser metadata and emitted opcode end-to-end in tests.

## Related Items

- **Depends on**: `/Users/andorpolgar/git/8f4e/docs/todos/250-add-f64-push-support.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/252-add-float-promote-demote-instructions.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/253-add-f64-support-for-basic-arithmetic.md`

## Notes

- Explicit suffixes are preferred over heuristic width inference (for example by digit length), which is not numerically reliable.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
