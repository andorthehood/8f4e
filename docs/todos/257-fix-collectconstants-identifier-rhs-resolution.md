---
title: 'TODO: Fix collectConstants identifier RHS resolution'
priority: High
effort: 2-4h
created: 2026-02-20
status: Open
completed: null
---

# TODO: Fix collectConstants identifier RHS resolution

## Problem Description

`collectConstants` currently assumes every `const` RHS is a literal and force-casts `arguments[1]` to `ArgumentLiteral`.

However, the `const` instruction compiler allows identifier RHS (constant aliasing), resolving against existing constants in scope.

Because namespace generation uses `collectConstants` output, identifier RHS constants can be collected incorrectly (for example `value: NaN`, missing type flags), causing namespace/export mismatches with actual compiler semantics.

## Proposed Solution

Update `collectConstants` to mirror `const` compiler semantics for RHS handling:
- literal RHS -> collect directly
- identifier RHS -> resolve against already-collected constants in the same AST (in order)
- unresolved identifier RHS -> fail deterministically (throw) or skip with explicit rationale (prefer throw to match compiler behavior)

Preserve metadata flags (including `isFloat64`) when aliasing constants.

## Anti-Patterns

- Do not continue using unsafe `as ArgumentLiteral` casting on RHS.
- Do not silently coerce unresolved identifier RHS into `NaN`.
- Do not diverge from `const` instruction compiler resolution rules.

## Implementation Plan

### Step 1: Refactor collectConstants traversal
- Replace current `Object.fromEntries(...map())` shortcut with ordered accumulation so identifier RHS can resolve prior entries.
- Handle RHS by argument type (`LITERAL` vs `IDENTIFIER`).

### Step 2: Align error behavior with compiler semantics
- On unresolved identifier RHS, throw a clear error (or equivalent explicit failure) instead of producing invalid const values.
- Keep behavior deterministic and testable.

### Step 3: Add tests
- Add tests for:
  - alias to previous const (`const B A`)
  - alias chain (`A`, `B A`, `C B`)
  - unresolved identifier (`const B Missing`) -> expected failure
  - metadata preservation (`isInteger`, `isFloat64`) through aliasing

## Validation Checkpoints

- `rg -n "collectConstants|ArgumentLiteral|const" packages/compiler/src/astUtils`
- `npx nx run @8f4e/compiler:test -- --run "collectConstants|const|namespace|use"`

## Success Criteria

- [ ] `collectConstants` correctly resolves identifier RHS aliases in declaration order.
- [ ] Unresolved identifier RHS no longer produce invalid collected const values.
- [ ] Collected constant metadata (`value`, `isInteger`, `isFloat64`) matches `const` compiler semantics.
- [ ] Namespace generation for `use` is consistent with instruction-level const resolution.

## Affected Components

- `packages/compiler/src/astUtils/collectConstants.ts`
- `packages/compiler/src/index.ts` (consumer path relying on collected namespaces)
- `packages/compiler/tests` and/or in-source tests in `collectConstants.ts`

## Risks & Considerations

- **Risk 1**: Behavioral differences between compile-time and namespace-collection-time error handling.
  - Mitigation: match `const` compiler semantics as closely as possible and document any intentional deviation.
- **Risk 2**: Existing tests may implicitly rely on permissive/incorrect behavior.
  - Mitigation: add explicit alias tests and adjust affected fixtures intentionally.

## Related Items

- **Related**: `docs/todos/256-add-f64-literal-suffix-support.md`
- **Related**: `docs/todos/250-add-f64-push-support.md`

## Notes

- This is a correctness fix and should land before broader float64 compiler refactors to avoid compounding namespace/type bugs.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
