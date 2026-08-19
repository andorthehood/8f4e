# glugglug2

`glugglug2` is a small immediate-mode WebGL2 sprite renderer. It keeps one sprite atlas in GPU memory and uploads one compact, ordered instance list per frame.

```ts
import { Engine, type SpriteLookup } from 'glugglug2';

const engine = new Engine(canvas);
const lookup: SpriteLookup = {
	player: { x: 0, y: 0, spriteWidth: 16, spriteHeight: 16 },
};

engine.setSpriteAtlas(atlasImage, lookup);
engine.render(() => {
	engine.drawSprite(10, 20, 'player');
	engine.drawSprite(40, 20, 'player', 32, 32);
});
```

Each sprite instance contains `x`, `y`, `width`, `height`, and one dense numeric sprite id. Calls are drawn in append order with premultiplied-alpha blending. `renderFrame()` is available for one synchronous frame, `resize()` explicitly changes the canvas drawing buffer, and `destroy()` stops the render loop and releases owned WebGL resources.

`drawSprite()` is an unchecked hot path. Atlas validity is checked when `setSpriteAtlas()` runs, but per-sprite lifecycle, identifier, and numeric-value validation is intentionally omitted. Callers must use identifiers from the active atlas and finite rectangle values.

See [ADR-001: Do Not Validate Programmer Input in the Sprite Hot Path](docs/adr/001-no-programmer-input-validation-in-the-sprite-hot-path.md) for the decision and its consequences.

The core engine intentionally has no caching, lines, text layout, post-processing, or general primitive API.

## Optional drawing utilities

`glugglug2/utils` provides a CPU-only `DrawContext` for nested coordinate offsets and single-line fixed-cell sprite text.
It wraps the structural `SpriteTarget` interface, so an `Engine`, a test recorder, or a future cache builder can receive
the final numeric sprite submissions without importing utility code into the core renderer.

```ts
import { Engine } from 'glugglug2';
import { DrawContext, type SpriteFont } from 'glugglug2/utils';

const engine = new Engine(canvas);
const draw = new DrawContext(engine);
const font: SpriteFont = {
	advanceX: 8,
	glyphIds: numericGlyphIds,
};

engine.renderFrame(() => {
	draw.pushOffset(panel.x, panel.y);
	draw.drawSprite(0, 0, panelSpriteId, panel.width, panel.height);
	draw.drawText(8, 16, 'status', font);
	draw.popOffset();
});
```

One context can be reused across frames. Offset pushes and pops must remain balanced. `drawText()` indexes the supplied
numeric glyph table with JavaScript UTF-16 character codes, skips undefined glyphs while preserving their fixed advance,
and performs no wrapping, alignment, shaping, measurement, font loading, or semantic sprite resolution. The context owns
neither its target nor the atlas, render loop, fonts, or caches.

## Visual regression tests

The Chromium snapshot covers atlas selection, default and explicit sizing, positioning, insertion-order layering,
alpha blending, instance-buffer growth, and clearing between frames.

```sh
npx nx run glugglug2:test:screenshot
npx nx run glugglug2:test:screenshot:update
```
