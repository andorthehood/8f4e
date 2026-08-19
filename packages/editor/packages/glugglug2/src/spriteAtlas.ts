import type { SpriteCoordinates, SpriteIdentifier, SpriteLookup } from './types.ts';

export type ResolvedSprite = SpriteCoordinates & {
	id: number;
};

export type PreparedSpriteAtlas = {
	metadata: Uint16Array;
	sprites: Map<string, ResolvedSprite>;
};

const UINT16_MAX = 0xffff;

/**
 * Validates public atlas metadata and converts it into GPU and CPU lookup forms.
 *
 * @param lookup - Public string-or-number sprite lookup supplied with the atlas image.
 * @param atlasWidth - Atlas image width in pixels.
 * @param atlasHeight - Atlas image height in pixels.
 * @returns Packed RGBA16UI metadata and a map of public keys to dense sprite ids.
 */
export function prepareSpriteAtlas(lookup: SpriteLookup, atlasWidth: number, atlasHeight: number): PreparedSpriteAtlas {
	assertAtlasDimension(atlasWidth, 'atlas width');
	assertAtlasDimension(atlasHeight, 'atlas height');

	const entries = Object.entries(lookup);
	if (entries.length === 0) {
		throw new Error('The sprite lookup must contain at least one sprite.');
	}

	const metadata = new Uint16Array(entries.length * 4);
	const sprites = new Map<string, ResolvedSprite>();

	for (const [id, [key, coordinates]] of entries.entries()) {
		validateCoordinates(key, coordinates, atlasWidth, atlasHeight);
		metadata.set([coordinates.x, coordinates.y, coordinates.spriteWidth, coordinates.spriteHeight], id * 4);
		sprites.set(normalizeSpriteIdentifier(key), { ...coordinates, id });
	}

	return { metadata, sprites };
}

/**
 * Converts public numeric and string sprite identifiers to the same map-key representation.
 *
 * @param identifier - Sprite identifier supplied by the caller.
 * @returns The normalized string key used by the CPU sprite lookup.
 */
export function normalizeSpriteIdentifier(identifier: SpriteIdentifier): string {
	return String(identifier);
}

/**
 * Validates one sprite source rectangle before it is encoded as uint16 metadata.
 *
 * @param key - Public sprite key used in validation errors.
 * @param coordinates - Source rectangle within the atlas.
 * @param atlasWidth - Atlas width in pixels.
 * @param atlasHeight - Atlas height in pixels.
 */
function validateCoordinates(
	key: string,
	coordinates: SpriteCoordinates,
	atlasWidth: number,
	atlasHeight: number
): void {
	const values: Array<[name: string, value: number]> = [
		['x', coordinates.x],
		['y', coordinates.y],
		['spriteWidth', coordinates.spriteWidth],
		['spriteHeight', coordinates.spriteHeight],
	];

	for (const [name, value] of values) {
		if (!Number.isInteger(value) || value < 0 || value > UINT16_MAX) {
			throw new RangeError(`Sprite ${JSON.stringify(key)} has an invalid ${name}; expected a uint16 value.`);
		}
	}

	if (coordinates.spriteWidth === 0 || coordinates.spriteHeight === 0) {
		throw new RangeError(`Sprite ${JSON.stringify(key)} must have positive source dimensions.`);
	}

	if (coordinates.x + coordinates.spriteWidth > atlasWidth || coordinates.y + coordinates.spriteHeight > atlasHeight) {
		throw new RangeError(`Sprite ${JSON.stringify(key)} extends outside the atlas.`);
	}
}

/**
 * Verifies that an atlas dimension is representable by the uint16 lookup texture.
 *
 * @param value - Atlas dimension in pixels.
 * @param name - Dimension name included in the error message.
 */
function assertAtlasDimension(value: number, name: string): void {
	if (!Number.isInteger(value) || value <= 0 || value > UINT16_MAX) {
		throw new RangeError(`${name} must be a positive uint16 value.`);
	}
}
