# Limit Burners

Small, self-contained tasks that are great for burning remaining usage limits before they expire. Each should be completable in a focused session with minimal context-gathering.

| ID | Title | Priority | Effort | Summary |
| ---- | ----- | -------- | ------ | ------- |
| 355 | Replace `isPointingToInt8`/`isPointingToInt16` booleans with a single `pointeeBaseType` field | 🟢 | 2-4h | The boolean-per-narrow-type pattern on `DataStructure` does not scale; a single discriminant field would simplify consumers and make adding new narrow pointer types trivial. |
| 356 | Consolidate declaration compilers into a single factory | 🟢 | 2-4h | The per-type declaration compiler files (`int.ts`, `int8.ts`, `int16.ts`, `float.ts`, `float64.ts`) are nearly identical; a `createDeclarationCompiler(baseType)` factory would eliminate the duplication. Best done after #355. |
| 357 | Reuse single-block recompute in bulk viewport-anchored loop | 🟢 | 30m | `recomputeViewportAnchoredPositions` duplicates the body of `recomputeViewportAnchoredPosition` instead of calling it. |
| 358 | Convert `worldPositionToAnchoredPos` to use an input object | 🟢 | 1h | The function takes 11 positional args while its counterpart uses a typed input object, making call sites fragile and inconsistent. |
| 359 | Audit `borderLineCoordinates` use of raw vs rounded viewport dimensions | 🟢 | 1-2h | Arrow indicators use raw pixel dimensions; anchored block positioning uses rounded dimensions — the intentional difference is undocumented. |
| 360 | Use `createMockState` in viewport-anchored dragging integration test | 🟢 | 30m | The test builds state by hand, causing silent breakage when new required fields are added to the viewport or state slices. |
| 361 | Replace `showBinary`/`showHex` booleans with a `displayFormat` union type | 🟢 | 1-2h | `MemoryIdentifier` and `Debugger` use two separate booleans for a mutually exclusive three-way display choice; a `displayFormat` union eliminates the invalid combined state and scales to future formats. |
| 362 | Refactor `ArgumentIdentifier` to a discriminated union | 🟡 | 2-4h | `ArgumentIdentifier` is a flat type with all fields optional; making it a proper discriminated union eliminates non-null assertions (`!`) scattered through `resolveCompileTimeArgument.ts`. |
| 363 | Enforce `classifyIdentifier` check ordering against misclassification | 🟢 | 1-2h | The `if`-chain in `classifyIdentifier` is order-dependent but unguarded; adding unit tests for ambiguous token shapes makes the ordering constraints regression-safe. |
