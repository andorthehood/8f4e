import {
	Engine,
	type SpriteAtlasImage,
	type SpriteAtlasResolver,
	type SpriteCoordinates,
	type SpriteIdentifier,
	type SpriteLookup,
} from 'glugglugglug';
import type { SpriteTarget } from 'glugglugglug/utils';

/** Loaded source sheet and public sprite keys accepted by glugglugglug. */
export interface SpriteAtlasSource {
	image: SpriteAtlasImage;
	lookup: SpriteLookup;
}

/** One additional sprite drawn synchronously using sprites from the source sheet. */
export interface CompositeSprite {
	id: SpriteIdentifier;
	width: number;
	height: number;
	draw: (target: SpriteTarget, sprites: SpriteAtlasResolver) => void;
}

/** A completed CPU-backed sheet that can be installed and restored by the main engine. */
export interface ExtendedSpriteAtlas {
	image: OffscreenCanvas;
	lookup: SpriteLookup;
}

const MAX_ATLAS_DIMENSION = 0xffff;

/**
 * Appends composed sprites below a source sheet without changing its public keys or source rectangles.
 *
 * Composites are packed in shelves, in definition order. Their callbacks run once on a temporary engine;
 * pixels are copied immediately into the output sheet before its drawing buffer can be discarded.
 * Callbacks resolve only source-sheet identifiers. Install the returned sheet to obtain final drawing ids.
 * The input image and lookup are never mutated, and temporary WebGL resources are released before returning.
 */
export function extendSpriteAtlas(
	source: SpriteAtlasSource,
	composites: readonly CompositeSprite[]
): ExtendedSpriteAtlas {
	assertDimension(source.image.width, 'Source atlas width');
	assertDimension(source.image.height, 'Source atlas height');
	const keys = new Set(Object.keys(source.lookup));
	let width = source.image.width;
	for (const composite of composites) {
		const key = String(composite.id);
		if (keys.has(key)) {
			throw new Error(`Duplicate sprite identifier ${JSON.stringify(key)}.`);
		}
		keys.add(key);
		assertDimension(composite.width, `Sprite ${JSON.stringify(key)} width`);
		assertDimension(composite.height, `Sprite ${JSON.stringify(key)} height`);
		width = Math.max(width, composite.width);
	}

	const placements: SpriteCoordinates[] = [];
	let x = 0;
	let y = source.image.height;
	let shelfHeight = 0;
	for (const composite of composites) {
		if (x + composite.width > width) {
			x = 0;
			y += shelfHeight;
			shelfHeight = 0;
		}
		placements.push({ x, y, spriteWidth: composite.width, spriteHeight: composite.height });
		x += composite.width;
		shelfHeight = Math.max(shelfHeight, composite.height);
	}
	const height = y + shelfHeight;
	assertDimension(height, 'Extended atlas height');
	const lookup: SpriteLookup = Object.fromEntries(
		Object.entries(source.lookup).map(([key, coordinates]) => [key, { ...coordinates }])
	);
	if (composites.length === 0) {
		const { image } = createSheet(source.image, width, height);
		return { image, lookup };
	}

	const canvas = document.createElement('canvas');
	const engine = new Engine(canvas);
	try {
		const maxTextureSize = Number(engine.gl.getParameter(engine.gl.MAX_TEXTURE_SIZE));
		if (width > maxTextureSize || height > maxTextureSize) {
			throw new RangeError(`Extended atlas ${width}x${height} exceeds the GPU texture limit of ${maxTextureSize}.`);
		}
		if (Object.keys(lookup).length + composites.length > maxTextureSize) {
			throw new RangeError(`Extended sprite lookup exceeds the GPU limit of ${maxTextureSize} entries.`);
		}
		const { image, context } = createSheet(source.image, width, height);
		const sprites = engine.setSpriteAtlas(source.image, source.lookup);
		for (const [index, composite] of composites.entries()) {
			engine.resize(composite.width, composite.height);
			engine.renderFrame(() => {
				const result: unknown = composite.draw(engine, sprites);
				if (result && typeof result === 'object' && 'then' in result) {
					throw new TypeError('Composite drawing callbacks must run synchronously.');
				}
			});
			const placement = placements[index];
			context.drawImage(canvas, placement.x, placement.y);
			Object.defineProperty(lookup, String(composite.id), {
				value: placement,
				enumerable: true,
				writable: true,
				configurable: true,
			});
		}
		return { image, lookup };
	} finally {
		engine.destroy();
		engine.gl.getExtension('WEBGL_lose_context')?.loseContext();
		canvas.width = 1;
		canvas.height = 1;
	}
}

function createSheet(source: SpriteAtlasImage, width: number, height: number) {
	const image = new OffscreenCanvas(width, height);
	const context = image.getContext('2d');
	if (!context) {
		throw new Error('Could not create the extended atlas drawing context.');
	}
	context.imageSmoothingEnabled = false;
	context.drawImage(source, 0, 0);
	return { image, context };
}

function assertDimension(value: number, name: string): void {
	if (!Number.isInteger(value) || value <= 0 || value > MAX_ATLAS_DIMENSION) {
		throw new RangeError(`${name} must be a positive uint16 value.`);
	}
}
