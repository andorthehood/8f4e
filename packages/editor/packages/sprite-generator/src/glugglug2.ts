import type { SpriteCoordinates, SpriteLookup } from 'glugglug2';

type SpriteLookupGroup = Record<string | number, SpriteCoordinates>;

/** One semantic sprite group resolved to dense numeric atlas identifiers. */
export type SpriteIdLookup = Record<string | number, number>;

export type Glugglug2SpriteIds<Lookups> = {
	[Group in keyof Lookups]: {
		[Sprite in keyof Lookups[Group]]: number;
	};
};

export type Glugglug2Atlas<Lookups> = {
	image: OffscreenCanvas;
	lookup: SpriteLookup;
	spriteIds: Glugglug2SpriteIds<Lookups>;
};

/**
 * Converts grouped semantic sprite lookups into the flat numeric lookup expected by glugglug2.
 *
 * Identical source rectangles share one dense id, while `spriteIds` retains the original lookup groups and keys so
 * callers do not need to construct global identifiers in the render loop.
 *
 * @param image - Generated atlas image accepted by `Engine.setSpriteAtlas()`.
 * @param groupedLookups - Existing sprite-generator lookup groups keyed by semantic role and local sprite identifier.
 * @returns A glugglug2 atlas image, flat lookup, and grouped numeric identifiers.
 */
export function createGlugglug2Atlas<Lookups extends object>(
	image: OffscreenCanvas,
	groupedLookups: Lookups
): Glugglug2Atlas<Lookups> {
	const lookup: SpriteLookup = {};
	const spriteIds: Record<string, Record<string, number>> = {};
	const idsByRectangle = new Map<string, number>();

	for (const [groupName, groupLookup] of Object.entries(groupedLookups as Record<string, SpriteLookupGroup>)) {
		const groupIds: Record<string, number> = {};

		for (const [spriteIdentifier, coordinates] of Object.entries(groupLookup)) {
			const rectangleKey = JSON.stringify([
				coordinates.x,
				coordinates.y,
				coordinates.spriteWidth,
				coordinates.spriteHeight,
			]);
			let id = idsByRectangle.get(rectangleKey);

			if (id === undefined) {
				id = idsByRectangle.size;
				idsByRectangle.set(rectangleKey, id);
				lookup[id] = { ...coordinates };
			}

			groupIds[spriteIdentifier] = id;
		}

		spriteIds[groupName] = groupIds;
	}

	return {
		image,
		lookup,
		spriteIds: spriteIds as Glugglug2SpriteIds<Lookups>,
	};
}
