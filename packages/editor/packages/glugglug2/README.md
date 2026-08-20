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

## Frame statistics

`engine.frameStats` is one stable, allocation-free view updated after every completed sprite pass. It reports
the number of submitted sprite rectangles and the used instance-buffer bytes sent to the GPU:

```ts
engine.renderFrame(drawScene);

console.log(engine.frameStats.spriteCount);
console.log(engine.frameStats.uploadedInstanceBytes);
```

The values describe only the core sprite pass; plugin uploads and draw calls are intentionally independent. During
sprite submission the view still describes the previous completed pass. `postDraw` hooks observe the current pass.

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

### Shader underlay plugin

`ShaderUnderlay` renders one optional fullscreen shader in `preDraw`, below RGBA layers, sprites, and overlays registered
after it. Its default vertex shader exposes the old glugglug-compatible `v_screenCoord`, `v_textureCoord`, and
top-left-origin `v_topLeftScreenCoord` varyings. Fragment shaders may optionally declare `u_time` in seconds and
`u_resolution` in drawing-buffer pixels.

```ts
import { ShaderUnderlay } from 'glugglug2';

const underlay = new ShaderUnderlay(engine);
underlay.setEffect({
	fragmentShader: `#version 300 es
		precision mediump float;
		in vec2 v_topLeftScreenCoord;
		out vec4 outColor;
		void main() {
			outColor = vec4(v_topLeftScreenCoord, 0.2, 1.0);
		}
	`,
});
```

Replacing an effect is atomic: a shader compilation or link failure leaves the previous effect active. `clearEffect()`
removes the current effect without detaching the plugin; `destroy()` detaches it and releases its GPU resources.

### RGBA texture layer plugin

`RgbaTextureLayer` uploads straight-alpha RGBA8 pixel arrays to reusable textures and draws them as top-left-origin
rectangles. It has one fixed phase for its lifetime: `preDraw` by default, or `postDraw` when constructed as an overlay.
The callback is where per-frame uploads and draws belong. Construct it after `ShaderUnderlay` to composite the RGBA
framebuffer over that shader while keeping both passes below the sprite scene.

```ts
import { RgbaTextureLayer } from 'glugglug2';

const layer = new RgbaTextureLayer(engine);
let texture = layer.uploadRgba8Texture(pixels, width, height);

layer.setDrawCallback(draw => {
	draw.drawTexture(texture, 10, 20, width * 2, height * 2);
});

// Reuses the same WebGL texture; equal dimensions also reuse its storage.
texture = layer.uploadRgba8Texture(nextPixels, width, height, { texture });
```

Uploads validate dimensions and byte length because they are explicit cold-path operations. `drawTexture()` is an
unchecked hot path. Filtering defaults to `nearest`; pass `{ filter: 'linear' }` when uploading to opt into interpolation.

### Post-process plugin

`PostProcess` installs an initially inactive final `postDraw` pass. An active effect performs one GPU framebuffer-to-
texture copy per frame and draws that texture through `u_renderTexture`; it never reads pixels back to the CPU. Construct
it after overlays that should be included. Constructing another `postDraw` plugin later places that plugin above the
processed result.

```ts
import { PostProcess } from 'glugglug2';

const postProcess = new PostProcess(engine);
postProcess.setEffect({
	fragmentShader: `#version 300 es
		precision mediump float;
		in vec2 v_textureCoord;
		uniform sampler2D u_renderTexture;
		out vec4 outColor;
		void main() {
			vec4 color = texture(u_renderTexture, v_textureCoord);
			outColor = vec4(color.rgb * vec3(1.0, 0.9, 0.8), color.a);
		}
	`,
});
```

The default vertex shader has the same varying contract and optional standard uniforms as `ShaderUnderlay`. With no
active effect, the hook returns before allocating capture storage or issuing any GPU work.

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
	draw.startGroup(panel.x, panel.y);
	draw.drawSprite(0, 0, panelSpriteId, panel.width, panel.height);
	draw.drawText(8, 16, 'status', font);
	draw.cacheGroup('legacy-code-block', 160, 80, () => {
		draw.drawText(8, 32, 'always redrawn', font);
	});
	draw.endGroup();
});
```

One context can be reused across frames. Every `startGroup()` call must have a matching `endGroup()` call. `drawText()`
indexes the supplied numeric glyph table with JavaScript UTF-16 character codes, skips undefined glyphs while preserving
their fixed advance, and performs no wrapping, alignment, shaping, measurement, font loading, or semantic sprite
resolution. The context owns neither its target nor the atlas, render loop, fonts, or caches.

`cacheGroup(cacheId, width, height, draw, enabled?, alpha?)` is only a migration shim for old `glugglug` call sites. It
executes `draw` exactly once on every call, even when disabled or called repeatedly with the same id, then returns
`false`. It retains no instructions, textures, or cache metadata; its other arguments are accepted but ignored. It has
no performance benefit. Real GPU raster caching remains separate future work tracked by TODO 468.

## Visual regression tests

The Chromium snapshot covers atlas selection, default and explicit sizing, positioning, insertion-order layering,
alpha blending, instance-buffer growth, clearing between frames, shader and RGBA underlays, the line overlay, and a
final GPU-copy post-process pass.

```sh
npx nx run glugglug2:test:screenshot
npx nx run glugglug2:test:screenshot:update
```
