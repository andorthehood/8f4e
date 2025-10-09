# TODO: Editor state callbacks refactor

**Priority**: 🟡
**Estimated Effort**: 1.5 days
**Created**: 2025-10-09
**Status**: Open
**Completed**: 

## Problem Description

The editor runtime keeps the callbacks passed in at initialization inside `state.options`, and a redundant copy of feature-flag overrides sits in both `state.featureFlags` (validated) and `state.options.featureFlags` (raw). This duplication allows the two sources to diverge and makes it harder to reason about which structure the rest of the code should read from. As more effects and menus depend on these callbacks, the ambiguous naming (`options`) also hides their purpose and increases the cost of onboarding or extending the state.

## Proposed Solution

- Keep the public `Options` initializer unchanged so callers are not broken, but split the internal state representation into `state.featureFlags` (validated) and `state.callbacks` (everything in `Options` except `featureFlags`).
- Update the initializer to destructure `{ featureFlags, ...callbacks }`, validate the feature flags once, and store the callbacks under a more explicit name.
- Refactor all `state.options.*` usages to reference `state.callbacks.*`, ensuring optional callback guards stay intact.
- Refresh documentation, TODO notes, and tests so they no longer mention `state.options`.

## Implementation Plan

### Step 1: Catalogue callback usage
- Enumerate every `state.options.*` access across effects, menus, loader, and tests.
- Expected outcome: complete map of callsites to update without missing optional checks.
- Dependencies or prerequisites: none.

### Step 2: Update types and initialization
- Introduce `Callbacks = Omit<Options, 'featureFlags'>` in `state/types.ts` and change `State` to store `callbacks`.
- In `state/index.ts`, destructure the initializer, validate feature flags, and assign `callbacks` to the state.
- Expected outcome: compiler-aware shape that enforces the new structure.
- Dependencies or prerequisites: Step 1 for context, TypeScript build.

### Step 3: Refactor callsites and docs
- Replace `state.options` with `state.callbacks` everywhere, including optional guards and tests; adjust docs/examples to reflect the new state layout.
- Expected outcome: all runtime logic and documentation consume the unified structures.
- Dependencies or prerequisites: Step 2 completed.

### Step 4: Verify changes
- Run `npm run typecheck` and the editor package tests to ensure no regressions.
- Expected outcome: clean typecheck/test run proving the refactor is safe.
- Dependencies or prerequisites: Steps 1–3 done.

## Success Criteria

- [ ] `State` interface exposes `callbacks` instead of `options` with no lingering references.
- [ ] Feature flags validation happens once and only `state.featureFlags` is read at runtime.
- [ ] Typecheck and editor tests pass after the refactor.

## Affected Components

- `packages/editor/src/state/types.ts` - redefine `State` shape and add `Callbacks`.
- `packages/editor/src/state/index.ts` - initialize `callbacks` and validated feature flags.
- `packages/editor/src/state/effects/**` and `packages/editor/src/view/**` - update references to the new state layout.
- `docs/feature-flags.md` and related TODO notes - document structural changes.

## Risks & Considerations

- **Risk 1**: Missing a `state.options` callsite could lead to runtime errors. *Mitigation*: rely on TypeScript errors after renaming the field and run typecheck.
- **Risk 2**: External consumers might rely on `state.options`. *Mitigation*: confirm the state object is internal; if exposure exists, provide migration notes or compatibility shims.
- **Dependencies**: Needs agreement that `state.options` is not part of the public API.
- **Breaking Changes**: Internal state shape change; ensure downstream code is reviewed.

## Related Items

- **Depends on**: None.
- **Related**: `todo/036-editor-config-testing-completion.md` (feature-flag coverage), `todo/033-editor-state-effects-testing.md` (state regression tests).
- **Blocks**: Future cleanup tasks that assume unified feature flags.

## References

- `packages/editor/src/state/index.ts`
- `packages/editor/src/state/effects/`
- `docs/feature-flags.md`

## Notes

- Consider exposing `Callbacks` type to package consumers for clarity.
- Record any new tests added during refactor.
- Update this TODO as steps complete.

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 
