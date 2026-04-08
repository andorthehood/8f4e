# Limit Burners

Small, self-contained tasks that are great for burning remaining usage limits before they expire. Each should be completable in a focused session with minimal context-gathering.

| ID | Title | Priority | Effort | Summary |
| ---- | ----- | -------- | ------ | ------- |
| 357 | Reuse single-block recompute in bulk viewport-anchored loop | 🟢 | 30m | `recomputeViewportAnchoredPositions` duplicates the body of `recomputeViewportAnchoredPosition` instead of calling it. |
| 358 | Convert `worldPositionToAnchoredPos` to use an input object | 🟢 | 1h | The function takes 11 positional args while its counterpart uses a typed input object, making call sites fragile and inconsistent. |
| 359 | Audit `borderLineCoordinates` use of raw vs rounded viewport dimensions | 🟢 | 1-2h | Arrow indicators use raw pixel dimensions; anchored block positioning uses rounded dimensions — the intentional difference is undocumented. |
| 361 | Replace `showBinary`/`showHex` booleans with a `displayFormat` union type | 🟢 | 1-2h | `MemoryIdentifier` and `Debugger` use two separate booleans for a mutually exclusive three-way display choice; a `displayFormat` union eliminates the invalid combined state and scales to future formats. |
| 362 | Refactor `ArgumentIdentifier` to a discriminated union | 🟡 | 2-4h | `ArgumentIdentifier` is a flat type with all fields optional; making it a proper discriminated union eliminates non-null assertions (`!`) scattered through `resolveCompileTimeArgument.ts`. |
| 363 | Enforce `classifyIdentifier` check ordering against misclassification | 🟢 | 1-2h | The `if`-chain in `classifyIdentifier` is order-dependent but unguarded; adding unit tests for ambiguous token shapes makes the ordering constraints regression-safe. |
