---
title: 'TODO: Refactor CodeBlock Extras to Objects'
priority: Medium
effort: 4-6h
created: 2025-11-22
status: Open
completed: null
---

# TODO: Refactor CodeBlock Extras to Objects

## Problem Description

The `CodeBlockGraphicData.extras` field in the editor state currently uses `Map` instances for most collections (inputs, outputs, debuggers, switches, buttons, bufferPlotters, pianoKeyboards, errorMessages). This makes the structure harder to serialize directly to JSON for snapshot tests and persisted editor state, and forces custom handling when cloning or comparing objects. It also adds friction when inspecting snapshot output because `Map` entries have to be converted to arrays or objects before they are human-readable.

In practice, `extras` only uses simple string/number keys (`id`, `lineNumber`) and relatively small collections that are rebuilt frequently. The theoretical advantages of `Map` (arbitrary key types, certain iteration guarantees) are not leveraged here, while the downsides for serialization and testing are very visible.

The rest of the state model largely uses plain arrays and objects, so the `Map` usage in `extras` is an inconsistency that complicates tooling and testing without providing clear benefits.

## Proposed Solution

- Replace all `Map`-based collections under `CodeBlockGraphicData.extras` with plain object dictionaries keyed by id or line number (e.g. `{ [id: string]: Switch }`).
- Preserve the ability to look up items by key efficiently while ensuring the representation is directly JSON-serializable.
- Update all writer paths (code block decorators, helpers) to populate plain objects instead of `Map`s.
- Update all reader paths (hit-testing helpers, web-ui drawers, connection rendering) to iterate over object values and perform keyed lookups via object properties.
- Update tests, fixtures, and screenshot test harnesses to expect object-based extras and snapshot them directly.
- We explicitly do not maintain backward compatibility for previously persisted runtime/editor state that used `Map`-shaped extras.

## Implementation Plan

### Step 1: Redefine extras types to objects

- In `packages/editor/packages/editor-state/src/types.ts`, change the `CodeBlockGraphicData.extras` type so all `Map<...>` fields become plain object dictionaries (e.g. `inputs: { [id: string]: Input }`, `outputs: { [id: string]: Output }`, `debuggers: { [id: string]: Debugger }`, etc.).
- For collections where the `Map` key carried semantics (e.g. `pianoKeyboards: Map<number, PianoKeyboard>`, `errorMessages: Map<number, {...}>`), use numeric-keyed dictionaries or wrap the key into the value as an explicit field, depending on what is most ergonomic for consumers.

### Step 2: Update construction helpers and defaults

- Update `createMockCodeBlock` in `packages/editor/packages/editor-state/src/helpers/testUtils.ts` so its default `extras` uses empty objects (`{}`) instead of `new Map()`.
- Update any other direct `extras: { ... }` literals (including screenshot test fixtures under `packages/editor/packages/web-ui/screenshot-tests`) to construct object-based extras.

### Step 3: Refactor writer code (decorators) to objects

- For each `updateGraphicData.ts` under `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockDecorators/**`:
  - Replace `extras.<name>.clear()` with `extras.<name> = {}`.
  - Replace `extras.<name>.set(key, value)` with `extras.<name>[key] = value`.
- Ensure that any ordering assumptions used by rendering or tests are either not relied upon or implemented explicitly when iterating (e.g. ordering by line number when converting to arrays for drawing if needed).

### Step 4: Refactor reader code (editor-state + web-ui) to objects

- In editor-state helpers (`findButtonAtViewportCoordinates`, `findSwitchAtViewportCoordinates`, `findPianoKeyboardAtViewportCoordinates`), replace `Array.from(map.values()).find(...)` with `Object.values(extras.<name>).find(...)` over object dictionaries.
- In web-ui drawers under `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/*.ts`, replace `for (const [, item] of codeBlock.extras.<name>)` with `for (const item of Object.values(codeBlock.extras.<name>))` and adjust any `Map` APIs (`get`, `has`, `size`) to object semantics (property access, `in` checks, `Object.keys`/`Object.values` length).
- Keep `GraphicHelper.outputsByWordAddress` as a `Map`, but populate it from the new object-based `extras.outputs` instead of from a `Map` on the extras itself.

### Step 5: Update tests and snapshots

- Update editor-state unit tests that currently assert on `extras` as `Map`s (e.g. `buttons/updateGraphicData.test.ts`, `switches/updateGraphicData.test.ts`, `debuggers/updateGraphicData.test.ts`, `outputs/updateGraphicData.test.ts`, `inputs/updateGraphicData.test.ts`, `pianoKeyboard/updateGraphicData.test.ts`, `errorMessages/errorMessages.test.ts`):
  - Replace `.size`, `.has`, `.get`, and `Array.from(...entries())` with object-based checks (`Object.keys(extras.<name>).length`, key membership, direct snapshot of the object).
- Update screenshot tests in `packages/editor/packages/web-ui/screenshot-tests` to construct extras as plain objects and update snapshots to the new, JSON-friendly representation.

### Step 6: Clean up serialization and persistence

- Search for any serialization or persistence code that touches `CodeBlockGraphicData` or `state.graphicHelper` and remove `Map`-specific handling for extras.
- Rely on the fact that plain objects are directly JSON-serializable for snapshot testing and session/project saving.
- Do not implement fallback or migration logic for old persisted extras; this change is allowed to break previously saved data.

## Success Criteria

- [ ] `CodeBlockGraphicData.extras` uses plain object dictionaries exclusively (no `Map` types in the extras definition).
- [ ] All decorators and helpers compile and run using object-based extras only.
- [ ] All editor-state and web-ui tests pass with updated snapshots using the new representation.
- [ ] Snapshot outputs for code block extras are human-readable JSON objects without custom serialization logic.

## Affected Components

- `packages/editor/packages/editor-state` - `CodeBlockGraphicData` types, code block decorators, helpers, and tests.
- `packages/editor/packages/web-ui` - Code block drawer modules and screenshot tests that consume `extras`.
- `docs/todos` - This TODO entry and any follow-up documentation about editor-state data modeling.

## Risks & Considerations

- **Risk (Breaking persisted state)**: Existing persisted projects or sessions that store `Map`-shaped extras will no longer deserialize correctly. This is acceptable for now but should be called out in release notes if user-facing persistence is in use.
- **Risk (Missed Map usage)**: Some `extras` consumers might still assume `Map` semantics; type errors should catch most of these, but manual review is needed around more dynamic code.
- **Dependencies**: None; this refactor is self-contained within editor-state and web-ui packages.
- **Breaking Changes**: This is intentionally breaking for any external consumers that relied on `Map`-based extras or serialized that structure directly.

## Related Items

- **Related**: `docs/todos/033-editor-state-effects-testing.md` (ensuring good coverage around code block effects and extras).

## References

- `packages/editor/packages/editor-state/src/types.ts` – `CodeBlockGraphicData` definition.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockDecorators/**` – Writer code that populates extras.
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/**` – Reader code that draws extras.

## Notes

- This refactor is aimed at simplifying serialization and snapshot testing rather than micro-optimizing runtime performance.
- If performance issues arise from array-based lookups in hot paths, local `Map` instances can be derived on-the-fly from arrays where truly necessary, without changing the serialized shape.
