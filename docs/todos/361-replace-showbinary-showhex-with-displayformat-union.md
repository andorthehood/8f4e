---
title: 'TODO: Replace showBinary/showHex booleans with a displayFormat union type'
priority: Low
effort: 1-2h
created: 2026-04-01
status: Open
completed: null
---

# TODO: Replace showBinary/showHex booleans with a displayFormat union type

## Problem Description

- `MemoryIdentifier` and `Debugger` both use two separate boolean flags (`showBinary`, `showHex`) to encode what is a mutually exclusive, three-way display choice (decimal / binary / hex).
- The current shape makes an invalid state representable: `{ showBinary: true, showHex: true }`.
- Adding any future display format (e.g. octal `0o`) would require yet another boolean on both interfaces, plus another branch in the renderer.

## Proposed Solution

Replace the two booleans with a single discriminant field:

```ts
displayFormat: 'decimal' | 'binary' | 'hex'
```

The renderer radix computation simplifies from:

```ts
const radix = showBinary ? 2 : showHex ? 16 : 10;
```

to a lookup map:

```ts
const radixMap = { decimal: 10, binary: 2, hex: 16 } as const;
const radix = radixMap[displayFormat];
```

Adding a new format in the future only requires adding one string to the union and one entry in the map.

## Implementation Plan

### Step 1: Update `MemoryIdentifier` and `Debugger` in `types.ts`
- Replace `showBinary: boolean` and `showHex: boolean` with `displayFormat: 'decimal' | 'binary' | 'hex'`.

### Step 2: Update `resolveMemoryIdentifier.ts`
- Replace the two local boolean vars with a single `displayFormat` local, defaulting to `'decimal'`.
- Set `displayFormat = 'binary'` on `0b` prefix, `displayFormat = 'hex'` on `0x` prefix.
- Return `displayFormat` in the result object.

### Step 3: Update `watch/resolve.ts`
- Pass `memory.displayFormat` through when constructing the `Debugger` widget.

### Step 4: Update `debuggers.ts`
- Destructure `displayFormat` instead of `showBinary` / `showHex`.
- Replace the ternary radix computation with the lookup map.

### Step 5: Update tests
- Fix any test that manually constructs a `Debugger` object to use `displayFormat: 'decimal'` instead of the old booleans.

## Success Criteria

- [ ] `MemoryIdentifier` and `Debugger` have no `showBinary`/`showHex` fields; `displayFormat` is the single source of truth.
- [ ] Invalid combined state (`showBinary: true, showHex: true`) is no longer representable at the type level.
- [ ] All existing tests pass.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts` — `Debugger` and `MemoryIdentifier` interfaces
- `packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts` — prefix parsing
- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/watch/resolve.ts` — widget construction
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/widgets/debuggers.ts` — renderer
- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/watch/resolve.test.ts` — test fixtures

## Risks & Considerations

- **Low risk**: Pure internal refactor; no user-facing behaviour changes.
- **No backward-compatibility needed**: We own the entire pipeline; remove the old booleans in one pass.

## Notes

- `showBinary` and `showHex` were introduced incrementally as the `0b` and `0x` prefixes were added to `@watch`. A `displayFormat` field was the cleaner design from the start.
