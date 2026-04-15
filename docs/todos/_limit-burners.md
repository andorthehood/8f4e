# Limit Burners

Small, self-contained tasks that are great for burning remaining usage limits before they expire. Each should be completable in a focused session with minimal context-gathering.

| ID | Title | Priority | Effort | Summary |
| ---- | ----- | -------- | ------ | ------- |
| 357 | Reuse single-block recompute in bulk viewport-anchored loop | 🟢 | 30m | `recomputeViewportAnchoredPositions` duplicates the body of `recomputeViewportAnchoredPosition` instead of calling it. |
| 358 | Convert `worldPositionToAnchoredPos` to use an input object | 🟢 | 1h | The function takes 11 positional args while its counterpart uses a typed input object, making call sites fragile and inconsistent. |
| 359 | Audit `borderLineCoordinates` use of raw vs rounded viewport dimensions | 🟢 | 1-2h | Arrow indicators use raw pixel dimensions; anchored block positioning uses rounded dimensions — the intentional difference is undocumented. |
| 362 | Refactor `ArgumentIdentifier` to a discriminated union | 🟡 | 2-4h | `ArgumentIdentifier` is a flat type with all fields optional; making it a proper discriminated union eliminates non-null assertions (`!`) scattered through `resolveCompileTimeArgument.ts`. |
