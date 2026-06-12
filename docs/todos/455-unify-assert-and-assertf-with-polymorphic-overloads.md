---
title: 'TODO: Unify assert and assertf with polymorphic overloads'
priority: Medium
effort: 2-4h
created: 2026-06-12
issue: null
status: Completed
completed: 2026-06-12
---

# TODO: Unify `assert` and `assertf` With Polymorphic Overloads

## Problem Description

The test helper functions `assert` and `assertf` predate polymorphic function overload support. As a result, some
fixture programs use `assertf` for float comparisons, while the CLI test harness imports `assert` overloads but not
`assertf`.

This creates avoidable confusion when running `.8f4e` fixture files directly through the CLI: a fixture can compile in
the compiler snapshot harness but fail through `cli test` with an undefined `assertf` import.

## Proposed Solution

Fold float assertions into the polymorphic `assert` helper and migrate fixtures away from `assertf`.

The CLI test harness should expose `assert` overloads for the scalar types needed by fixture programs. Existing
`assertf` support can either be removed after migration or kept as a compatibility alias if existing external examples
depend on it.

## Implementation Plan

### Step 1: Audit Test Helper Imports

- Inspect the CLI test harness and compiler fixture harness for imported assertion helpers.
- Decide whether `assertf` should become an alias or be removed entirely after migration.

### Step 2: Add Float `assert` Coverage

- Ensure `assert(float received, float expected)` works through polymorphic overload resolution.
- Add any needed float64 coverage separately if the harness supports float64 assertions.

### Step 3: Migrate Fixture Programs

- Replace `call assertf` with `call assert` where the operands are floats.
- Remove or deprecate `assertf` only after all internal fixtures no longer need it.

## Validation Checkpoints

- `node packages/cli/bin/cli.js test packages/compiler/tests/stdlib/read-interpolated-int.test.8f4e`
- `node packages/cli/bin/cli.js test packages/compiler/tests/stdlib/read-interpolated-float.test.8f4e`
- `npx nx run @8f4e/compiler:test -- tests/fixturePrograms.test.ts`

## Success Criteria

- [x] Float assertion fixtures can run through the CLI without importing `assertf`.
- [x] Internal `.8f4e` tests use polymorphic `assert` consistently.
- [x] Any remaining `assertf` use is documented as a compatibility alias or removed.

## Affected Components

- `packages/cli/src/test/command.ts` - host assertion imports.
- `packages/compiler/tests/**/*.8f4e` - fixture migration.
- `packages/compiler/tests/testUtils.ts` - compiler fixture harness assertion imports, if applicable.

## Risks & Considerations

- **Floating-point comparison semantics**: exact equality may be fine for existing deterministic fixtures, but future
  approximate float assertions may need a separate helper.
- **Compatibility**: external or older fixtures may still call `assertf`; decide whether that should remain accepted.

## Related Items

- **Related**: `docs/todos/435-add-polymorphic-function-overloads.md`

