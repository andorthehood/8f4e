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

`drawSprite()` and per-frame rendering are unchecked hot paths. Atlas validity is checked when `setSpriteAtlas()` runs,
but sprite lifecycle, identifier, numeric-value, and per-frame destruction validation is intentionally omitted. Callers
must use identifiers from the active atlas, finite rectangle values, and must not render after destroying the engine.
Violations are programmer errors with unspecified consequences.

See [ADR-001: Do Not Validate Programmer Input in Render Hot Paths](docs/adr/001-no-programmer-input-validation-in-the-sprite-hot-path.md) for the decision and its consequences.

The core engine intentionally has no caching, lines, text layout, post-processing, or general primitive API.

## Render-hook plugins

The engine exposes its exact `WebGL2RenderingContext` as `engine.gl` and two ordered mutable hook arrays. `preDraw` hooks
run after the frame clear and before the application callback; `postDraw` hooks run after the sprite pass, including on
frames with no sprites. This deliberately small plugin surface supports arbitrary underlays and overlays without adding
checks to `drawSprite()`.

```ts
engine.hooks.preDraw.push(gl => {
	background.draw(gl);
});

engine.hooks.postDraw.push(gl => {
	diagnostics.draw(gl);
});
```

Hooks are trusted code sharing unrestricted context state. The engine defensively restores the state needed by its next
clear and sprite pass, but this is not a sandbox: hooks can still clear the canvas, lose the context, or deliberately
discover and destroy engine resources. Hook errors propagate, hook arrays run in insertion order, and mutating an array
while it is being iterated is a programmer error with unspecified consequences. Plugins own and must delete every GPU
resource they create.

### Line overlay example plugin

`LineDrawer` is an exported example plugin built on those hooks. It resets a reusable CPU line buffer in `preDraw`, then
uploads and draws all submitted lines in one instanced `postDraw` call, above every sprite. Each line carries endpoints,
thickness, and packed RGBA color; it does not use or modify the sprite atlas.

```ts
import { Engine, LineDrawer } from 'glugglug2';

const engine = new Engine(canvas);
const lines = new LineDrawer(engine);

engine.renderFrame(() => {
	engine.drawSprite(20, 20, 'panel', 120, 80);
	lines.drawLine(20, 20, 140, 100, 2, [1, 0.25, 0.1, 1]);
});

// External plugins have an independent lifetime.
lines.destroy();
engine.destroy();
```

Color components are normalized from `0` to `1`. Like sprite submission, `drawLine()` performs no hot-path validation;
invalid coordinates, thicknesses, colors, or lifecycle calls are programmer errors with unspecified consequences.

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
alpha blending, instance-buffer growth, clearing between frames, a raw-context underlay, and the line-plugin overlay.

```sh
npx nx run glugglug2:test:screenshot
npx nx run glugglug2:test:screenshot:update
```
