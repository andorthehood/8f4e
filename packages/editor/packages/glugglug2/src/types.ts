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

/** Statistics for the most recently completed sprite pass. */
export type SpriteFrameStats = {
	/** Number of sprite rectangles submitted to the completed sprite pass. */
	readonly spriteCount: number;
	/** Number of used instance-buffer bytes uploaded for that sprite pass. */
	readonly uploadedInstanceBytes: number;
};

/**
 * Performs one trusted custom WebGL pass during a render frame.
 *
 * @param gl - Raw context shared with the engine and other render hooks.
 */
export type RenderHook = (gl: WebGL2RenderingContext) => void;

/**
 * Mutable ordered hook lists surrounding application sprite submission.
 *
 * Hooks share the engine's raw WebGL context. They own every resource they
 * create, and mutating a list while it is being iterated has unspecified
 * consequences.
 */
export type RenderHooks = {
	/** Hooks that run after the frame clear and before the application callback. */
	readonly preDraw: RenderHook[];
	/** Hooks that run after the sprite pass, including frames with no sprites. */
	readonly postDraw: RenderHook[];
};

/** Minimal public surface consumed by render-hook plugins. */
export type RenderPluginHost = {
	/** Raw WebGL2 context shared by the engine and trusted plugins. */
	readonly gl: WebGL2RenderingContext;
	/** Ordered hook lists used to place custom passes around the sprite pass. */
	readonly hooks: RenderHooks;
};
