import type { SpriteCoordinates, SpriteLookup } from 'glugglug';

type SpriteLookupGroup = Record<string | number, SpriteCoordinates>;

declare const spriteIdBrand: unique symbol;

/** Dense atlas identifier created only after its source rectangle has been validated. */
export type SpriteId = number & { readonly [spriteIdBrand]: true };

/** One sparse semantic sprite group resolved to validated dense atlas identifiers. */
export type SpriteIdLookup = Partial<Record<string | number, SpriteId>>;

export type SpriteIds<Lookups> = {
	[Group in keyof Lookups]: {
		[Sprite in keyof Lookups[Group]]: undefined extends Lookups[Group][Sprite] ? SpriteId | undefined : SpriteId;
	};
};

export type SpriteAtlas<SpriteIds> = {
	image: OffscreenCanvas;
	lookup: SpriteLookup;
	spriteIds: SpriteIds;
};

/**
 * Converts grouped semantic sprite lookups into a flat numeric atlas lookup.
 *
 * Identical source rectangles share one dense id, while `spriteIds` retains the original lookup groups and keys so
 * callers do not need to construct global identifiers in the render loop.
 *
 * @param image - Generated atlas image accepted by `Engine.setSpriteAtlas()`.
 * @param groupedLookups - Existing sprite-generator lookup groups keyed by semantic role and local sprite identifier.
 * @returns An atlas image, flat lookup, and grouped numeric identifiers.
 */
export function createSpriteAtlas<Lookups extends object>(
	image: OffscreenCanvas,
	groupedLookups: Lookups
): SpriteAtlas<SpriteIds<Lookups>> {
	const lookup: SpriteLookup = {};
	const spriteIds: Record<string, Record<string, SpriteId>> = {};
	const idsByRectangle = new Map<string, SpriteId>();

	for (const [groupName, groupLookup] of Object.entries(groupedLookups as Record<string, SpriteLookupGroup>)) {
		const groupIds: Record<string, SpriteId> = {};

		for (const [spriteIdentifier, coordinates] of Object.entries(groupLookup)) {
			assertValidCoordinates(image, groupName, spriteIdentifier, coordinates);
			const rectangleKey = JSON.stringify([
				coordinates.x,
				coordinates.y,
				coordinates.spriteWidth,
				coordinates.spriteHeight,
			]);
			let id = idsByRectangle.get(rectangleKey);

			if (id === undefined) {
				id = idsByRectangle.size as SpriteId;
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
		spriteIds: spriteIds as SpriteIds<Lookups>,
	};
}

/**
 * Validates a source rectangle before its dense number is branded as a usable sprite id.
 *
 * @param image - Atlas image that must fully contain the rectangle.
 * @param groupName - Semantic lookup group used in validation errors.
 * @param spriteIdentifier - Semantic sprite key used in validation errors.
 * @param coordinates - Rectangle to validate against the atlas and packed lookup format.
 */
function assertValidCoordinates(
	image: OffscreenCanvas,
	groupName: string,
	spriteIdentifier: string,
	coordinates: SpriteCoordinates
): void {
	const values = [coordinates.x, coordinates.y, coordinates.spriteWidth, coordinates.spriteHeight];
	if (values.some(value => !Number.isInteger(value) || value < 0 || value > 0xffff)) {
		throw new RangeError(`Sprite ${groupName}.${spriteIdentifier} contains coordinates outside the uint16 range.`);
	}
	if (coordinates.spriteWidth === 0 || coordinates.spriteHeight === 0) {
		throw new RangeError(`Sprite ${groupName}.${spriteIdentifier} must have positive dimensions.`);
	}
	if (
		coordinates.x + coordinates.spriteWidth > image.width ||
		coordinates.y + coordinates.spriteHeight > image.height
	) {
		throw new RangeError(`Sprite ${groupName}.${spriteIdentifier} extends outside the atlas image.`);
	}
}
