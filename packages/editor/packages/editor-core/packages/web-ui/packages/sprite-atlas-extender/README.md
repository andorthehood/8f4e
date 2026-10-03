# Sprite Atlas Extender

`@8f4e/sprite-atlas-extender` adds composed sprites to an existing sheet before rendering starts. It uses a temporary
glugglugglug engine to bake each composition and returns one completed `OffscreenCanvas` and `SpriteLookup`.
The main engine uses its existing `setSpriteAtlas()` and `drawSprite()` APIs.

```ts
import { extendSpriteAtlas } from '@8f4e/sprite-atlas-extender';
import { Engine } from 'glugglugglug';

const completed = extendSpriteAtlas(
	{ image: sourceImage, lookup: sourceLookup },
	[
		{
			id: 'panel',
			width: 320,
			height: 120,
			draw(target, sprites) {
				target.drawSprite(0, 0, sprites.resolveSprite('background'), 320, 120);
				target.drawSprite(12, 12, sprites.resolveSprite('icon'));
			},
		},
	]
);

const engine = new Engine(canvas);
const sprites = engine.setSpriteAtlas(completed.image, completed.lookup);
const panel = sprites.resolveSprite('panel');
engine.render(() => engine.drawSprite(40, 80, panel));
```

## Contract

- The input image must be loaded and have positive integer dimensions. It can be an image, canvas, offscreen canvas,
  or bitmap supported by glugglugglug.
- Existing keys and rectangles are preserved. The source image and lookup are not mutated.
- Composites are packed in shelves below the original sheet, in definition order. The output width grows if a composite
  is wider than the original. Dimensions and lookup capacity must fit the engine's uint16 metadata and GPU limits.
- Each callback runs once, synchronously, with a transparent surface, local top-left coordinates, and clipping to its
  requested dimensions. The drawing target implements `SpriteTarget`, so glugglugglug drawing utilities can wrap it.
- The callback resolver contains source-sheet keys only. To compose sprites from a previous extension, pass that
  completed sheet as the source for a subsequent call.
- Composite identifiers must be unique across source and new entries. Numeric and string forms of a key are equivalent.
- Temporary sprite IDs belong to the baking engine. Resolve public keys again when installing the returned atlas.
- A browser with WebGL2, DOM canvas, and `OffscreenCanvas` support is required. The temporary WebGL resources and context
  are released before returning, including when drawing fails.
- The returned sheet retains the generated pixels, allowing the main engine to restore its atlas after releasing GPU
  rendering memory without rerunning the callbacks.

The package defines no editor sprites. Consumers supply composition definitions and keep their own semantic groups.
Web-ui uses this package to build its repeating background tile from filled rectangles using the source fill-color sprites.

## Validation

- `npx nx run @8f4e/sprite-atlas-extender:build`
- `npx nx run @8f4e/sprite-atlas-extender:typecheck`
- `npx nx run @8f4e/sprite-atlas-extender:test`
- `npx nx run @8f4e/sprite-atlas-extender:test:browser`
