export type SpriteCoordinates = {
	spriteWidth: number;
	spriteHeight: number;
	x: number;
	y: number;
};

export type SpriteLookup = Record<string | number, SpriteCoordinates>;

export type EngineOptions = {
	/** Enable caching functionality. Defaults to false. */
	caching?: boolean;
	/** Maximum number of cache items when caching is enabled. Defaults to 50. */
	maxCacheItems?: number;
};
