---
title: 'TODO: Add optional drawing utilities to glugglug2'
priority: Medium
effort: 1-2d
created: 2026-08-19
issue: null
status: Completed
completed: 2026-08-19
---

# TODO: Add optional drawing utilities to glugglug2

## Problem Description

`glugglug2` intentionally exposes a small immediate-mode API that appends final rectangles and numeric sprite ids to a
reusable instance buffer. Applications still need common CPU-side conveniences such as nested coordinate offsets and
fixed-cell sprite text. Reimplementing those conveniences independently in every consumer would duplicate state handling
and text expansion, while adding them directly to `Engine` would make the core renderer stateful around concepts that do
not affect GPU resources or batching.

Ship an optional utility layer alongside `glugglug2`. The utility layer should compose final sprite submissions while
keeping the core engine focused on atlas resources, instance storage, shaders, and drawing. It must remain generic: font
selection, semantic sprite names, syntax colors, widget roles, and other application policy stay with the caller.

## Proposed Solution

Add a separate `glugglug2/utils` package entry point containing a reusable `DrawContext` and its supporting types. The
context wraps a minimal `SpriteTarget`, maintains a nested translation stack, expands fixed-cell text into ordered sprite
calls, and always forwards final canvas coordinates and numeric ids to the target. `Engine` satisfies this interface
structurally without importing the utility layer.

```ts
interface SpriteTarget {
	drawSprite(x: number, y: number, spriteId: number, width?: number, height?: number): void;
}
```

Keeping the target structural allows the same context to wrap the engine, a test recorder, or a future raster-cache
builder with the same drawing signature.

Representative API:

```ts
import { Engine } from 'glugglug2';
import { DrawContext, type SpriteFont, type SpriteTarget } from 'glugglug2/utils';

const engine = new Engine(canvas);
const target: SpriteTarget = engine;
const draw = new DrawContext(target);
const font: SpriteFont = {
	glyphIds: numericGlyphIds,
	advanceX: 8,
};

engine.renderFrame(() => {
	draw.pushOffset(module.x, module.y);
	draw.drawSprite(0, 0, moduleBackgroundId, module.width, module.height);
	draw.drawText(8, 16, 'hello', font);
	draw.popOffset();
});
```

`DrawContext.drawSprite()` should mirror the core sprite argument order and add the current accumulated offset before
delegating. `pushOffset()` should add a local translation to the accumulated translation; `popOffset()` should restore
the previous translation and support arbitrary nesting without allocating new stack storage after capacity has grown.

`drawText()` should be deliberately limited to one line of fixed-cell sprite text. For each UTF-16 character code, it
reads the numeric sprite id from the supplied font table, advances by `advanceX`, and appends the glyph in string order.
Undefined glyph entries should be skipped while still consuming their cell advance. Spaces can therefore be either an
explicit transparent glyph or an undefined entry. Rich text can select another font table between calls or use a
caller-owned loop; the utility does not own semantic font roles.

The utility entry point may depend on public `glugglug2` types, but the core entry point must not import the utility
layer. Consumers that only need direct sprite submission should not instantiate or carry any utility state.

## Anti-Patterns

- Do not add offset stacks, `drawText()`, font state, or an active sprite lookup to `Engine`.
- Do not accept semantic sprite names in the utility API; callers supply final numeric sprite ids and numeric glyph
  tables.
- Do not make the utility layer depend on `web-ui`, `sprite-generator`, editor state, color schemes, or application enums.
- Do not add wrapping, alignment, kerning, shaping, fallback-font discovery, multiline layout, or text measurement to the
  MVP.
- Do not call `setSpriteLookup()` or mutate atlas state while drawing text.
- Do not allocate a glyph instruction array or substring for each `drawText()` call; append directly to the engine in one
  pass over the input string.
- Do not describe coordinate offsets as GPU groups, render batches, or caches. They are only CPU-side coordinate
  composition.
- Do not combine this work with raster caching. Reusable GPU-rendered groups remain a separate feature.
- Do not add pre-resolved glyph-run drawing, font factories, or text-measurement helpers in this iteration. Add only the
  `SpriteTarget` abstraction beyond the already planned offset and fixed-cell text utilities.

## Implementation Plan

### Step 1: Define the optional utility entry point

- Add a `glugglug2/utils` export without re-exporting its API from the package root.
- Add the public structural `SpriteTarget` interface and fixed-cell `SpriteFont` contract.
- Keep the dependency direction one-way: utilities can use the core API, while core engine and renderer modules know
  nothing about utilities.

### Step 2: Implement the drawing context

- Store the current X/Y translation and reusable stack storage in `DrawContext`.
- Implement nested `pushOffset(x, y)` and `popOffset()` operations.
- Implement `drawSprite(x, y, spriteId, width?, height?)` by adding the current translation and forwarding directly to
  the wrapped `SpriteTarget`.
- Avoid per-call objects, closures, array slices, or other allocations in offset and sprite hot paths.

### Step 3: Implement fixed-cell sprite text

- Define `SpriteFont` with a character-code-indexed numeric glyph table and horizontal cell advance.
- Implement single-line `drawText(x, y, text, font)` as an allocation-free loop that preserves character order.
- Skip undefined glyphs while preserving their advance and document that JavaScript UTF-16 code units are used as table
  indexes.
- Use the core sprite's intrinsic dimensions unless a later demonstrated use case requires explicit text scaling.

### Step 4: Document lifecycle and ownership

- Add a concise `glugglug2/utils` example to the package README.
- State that one context can be reused across frames and must have balanced offset pushes and pops.
- Document that the utility does not own the engine, atlas, render loop, fonts, semantic ids, or caches.
- Explain that callers select the appropriate numeric font table before calling `drawText()`.

### Step 5: Add focused coverage

- Test direct sprite forwarding with and without offsets.
- Test against a minimal recording `SpriteTarget` rather than requiring WebGL or a concrete engine.
- Test nested offsets, restoration after popping, and context reuse across frames.
- Test glyph order, fixed advances, non-zero context offsets, empty strings, spaces, and undefined glyphs.
- Test that drawing text appends directly without changing atlas or renderer state.
- Add a small browser example only if the existing example cannot clearly demonstrate both nested offsets and text.

## Validation Checkpoints

- `npx nx run glugglug2:build`
- `npx nx run glugglug2:typecheck`
- `npx nx run glugglug2:test`
- `npx nx run glugglug2:lint`
- Confirm `glugglug2` root imports do not expose utility symbols and `glugglug2/utils` resolves from built package output.
- Confirm repeated `drawText()` calls allocate no temporary glyph arrays, substrings, or per-character objects.

## Success Criteria

- [x] Consumers can import `DrawContext`, `SpriteFont`, and `SpriteTarget` from `glugglug2/utils`.
- [x] `Engine`, test recorders, and the planned raster-cache builder can satisfy `SpriteTarget` structurally without
      importing utilities into the core renderer.
- [x] The root `glugglug2` API remains focused on direct sprite rendering and GPU resource management.
- [x] Nested offsets produce correct final coordinates and restore previous offsets when popped.
- [x] `drawText()` appends ordered numeric glyph sprites using fixed horizontal advances.
- [x] Undefined glyphs are skipped without changing the position of later cells.
- [x] The offset and text hot paths create no per-call or per-glyph temporary objects.
- [x] The utility layer contains no application-specific sprite names, font roles, editor types, or atlas generation logic.
- [x] Unit tests and package build, typecheck, and lint targets pass.

## Affected Components

- `packages/editor/packages/glugglug2/src/utils/` - Sprite target, drawing context, fixed-cell font contract, and focused
  tests.
- `packages/editor/packages/glugglug2/package.json` - Optional `./utils` subpath export.
- `packages/editor/packages/glugglug2/README.md` - Utility usage, limitations, and ownership documentation.
- `packages/editor/packages/glugglug2/tsconfig.json` - Built subpath inclusion if the existing source glob requires an
  adjustment.

## Risks & Considerations

- **Unbalanced offsets**: A missing `popOffset()` affects later positions. The utility should document balanced use; any
  optional diagnostic checks must not add work to sprite or glyph submission.
- **Character representation**: UTF-16 code-unit indexing is appropriate for the current bitmap atlases but does not
  provide Unicode shaping or grapheme handling.
- **Missing glyphs**: Skipping undefined entries preserves layout but can hide incomplete font tables. Font-table
  validation, if desired, belongs on a cold creation path rather than inside each glyph submission.
- **API creep**: Text measurement and rich layout can quickly turn a small sprite utility into a UI toolkit. Add features
  only when a concrete renderer-independent use case appears.
- **Package exports**: The build must emit a stable utility module path that matches the `./utils` export declaration.
- **Target drift**: Future engine and cache-builder sprite signatures should remain structurally compatible with
  `SpriteTarget` or deliberately version the utility contract.

## Related Items

- **Depends on**: TODO 467 (Add instanced sprite-only glugglug2 renderer; completed)
- **Related**: TODO 468 (Add shader-batched raster caches to glugglug2)
- **Follow-up**: TODO 470 (Add no-op cacheGroup compatibility helper to glugglug2 utilities)
- **Related**: `packages/editor/packages/glugglug2/docs/adr/001-no-programmer-input-validation-in-the-sprite-hot-path.md`

## Notes

- Implemented `SpriteTarget`, `SpriteFont`, `GlyphIdTable`, and `DrawContext` under the optional `glugglug2/utils`
  subpath with no root-entry-point re-exports.
- `DrawContext` uses retained parallel offset stacks, forwards numeric sprites directly, and expands text in one UTF-16
  loop without temporary glyph instructions.
- The proposed API and missing-glyph policy were implemented without changes. Pre-resolved glyph runs, font factories,
  measurement, rich layout, and cache behavior remain outside this utility layer.
- `web-ui` can later consume this utility while retaining ownership of semantic sprite-id and syntax-color resolution.
- `SpriteTarget` is intentionally structural. Core renderers and cache builders should not import the optional utility
  entry point merely to declare conformance.
- The utility's offset stack replaces the coordinate-composition portion of the old `startGroup()` / `endGroup()` API;
  it does not reproduce old cache-group behavior.
- Raster caching can cache the sprite instances produced by `drawText()` later without moving cache ownership into the
  utility layer.

## Archive Instructions

Completed on 2026-08-19. The final API, missing-glyph behavior, and implemented scope are recorded above.
