export type SpriteIdentifier = string | number;

export type SpriteCoordinates = {
	x: number;
	y: number;
	spriteWidth: number;
	spriteHeight: number;
};

export type SpriteLookup = Record<SpriteIdentifier, SpriteCoordinates>;

export type SpriteAtlasImage = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas | ImageBitmap;

export type EngineOptions = {
	/** Initial number of sprite instances retained by the CPU and GPU buffers. */
	initialCapacity?: number;
};

export type RenderCallback = () => void;
