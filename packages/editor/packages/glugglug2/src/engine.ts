import { Renderer } from './renderer.ts';

import type {
	EngineOptions,
	RenderCallback,
	RenderHooks,
	SpriteAtlasImage,
	SpriteIdentifier,
	SpriteLookup,
} from './types.ts';

const DEFAULT_INITIAL_CAPACITY = 1_024;

/**
 * Provides the public immediate-mode API for drawing atlas sprites onto a canvas.
 *
 * The engine owns the render loop and delegates compact instance storage and
 * WebGL2 resource management to its renderer.
 */
export class Engine {
	private readonly renderer: Renderer;
	/** Raw WebGL2 context shared with trusted render-hook plugins. */
	readonly gl: WebGL2RenderingContext;
	/** Mutable hook arrays executed in insertion order around the sprite pass. */
	readonly hooks: RenderHooks = {
		preDraw: [],
		postDraw: [],
	};
	private destroyed = false;
	private frameOpen = false;
	private continuousRendering = false;
	private animationFrameRequest: number | null = null;

	/**
	 * Creates a sprite engine for an HTML canvas.
	 *
	 * @param canvas - Canvas whose drawing buffer receives rendered sprites.
	 * @param options - Optional initial instance-buffer configuration.
	 */
	constructor(canvas: HTMLCanvasElement, options: EngineOptions = {}) {
		this.renderer = new Renderer(canvas, options.initialCapacity ?? DEFAULT_INITIAL_CAPACITY);
		this.gl = this.renderer.gl;
	}

	/**
	 * Atomically replaces the persistent atlas image and its sprite lookup.
	 *
	 * @param image - Loaded image, canvas, offscreen canvas, or bitmap containing every sprite.
	 * @param lookup - Public identifiers and source rectangles for sprites in the image.
	 */
	setSpriteAtlas(image: SpriteAtlasImage, lookup: SpriteLookup): void {
		this.assertLive();
		if (this.frameOpen) {
			throw new Error('The sprite atlas cannot be replaced while a frame is being built.');
		}
		this.renderer.setSpriteAtlas(image, lookup);
	}

	/**
	 * Starts one continuous requestAnimationFrame loop and renders its first frame immediately.
	 *
	 * @param callback - Function that submits sprites for each frame.
	 */
	render(callback: RenderCallback): void {
		this.assertLive();
		if (this.continuousRendering) {
			throw new Error('The continuous render loop is already running.');
		}

		this.continuousRendering = true;
		/** Renders one loop iteration and schedules the next while the engine remains active. */
		const renderNextFrame = (): void => {
			if (!this.continuousRendering || this.destroyed) {
				return;
			}

			try {
				this.renderFrame(callback);
			} catch (error) {
				this.continuousRendering = false;
				this.animationFrameRequest = null;
				throw error;
			}

			if (this.continuousRendering && !this.destroyed) {
				this.animationFrameRequest = requestAnimationFrame(renderNextFrame);
			}
		};

		renderNextFrame();
	}

	/**
	 * Clears, builds, uploads, and draws one frame synchronously.
	 *
	 * This performance-first per-frame path does not check whether the engine
	 * was destroyed. Rendering after destruction is a programmer error with
	 * unspecified consequences.
	 *
	 * @param callback - Function that submits the ordered sprites for this frame.
	 */
	renderFrame(callback: RenderCallback): void {
		if (this.frameOpen) {
			throw new Error('Cannot start a render frame while another frame is being built.');
		}

		this.frameOpen = true;
		try {
			this.renderer.beginFrame();
			for (const hook of this.hooks.preDraw) {
				hook(this.gl);
			}
			callback();
			this.renderer.flush();
			for (const hook of this.hooks.postDraw) {
				hook(this.gl);
			}
		} finally {
			this.frameOpen = false;
		}
	}

	/**
	 * Writes one sprite directly to the current frame's reusable instance buffer.
	 *
	 * This performance-first hot path intentionally does not validate lifecycle,
	 * identifier, or numeric input. Invalid calls are programmer errors with
	 * unspecified consequences.
	 *
	 * @param x - Destination X coordinate in canvas pixels.
	 * @param y - Destination Y coordinate in canvas pixels.
	 * @param sprite - Public string or number identifier from the active atlas.
	 * @param width - Optional destination width; defaults to the sprite source width.
	 * @param height - Optional destination height; defaults to the sprite source height.
	 */
	drawSprite(x: number, y: number, sprite: SpriteIdentifier, width?: number, height?: number): void {
		this.renderer.drawSprite(x, y, sprite, width, height);
	}

	/**
	 * Resizes the canvas drawing buffer and WebGL viewport.
	 *
	 * @param width - New positive integer width in physical canvas pixels.
	 * @param height - New positive integer height in physical canvas pixels.
	 */
	resize(width: number, height: number): void {
		this.assertLive();
		this.renderer.resize(width, height);
	}

	/**
	 * Stops continuous rendering and releases every WebGL resource owned by the engine.
	 *
	 * Repeated calls are safe and have no additional effect.
	 */
	destroy(): void {
		if (this.destroyed) {
			return;
		}

		this.destroyed = true;
		this.continuousRendering = false;
		if (this.animationFrameRequest !== null) {
			cancelAnimationFrame(this.animationFrameRequest);
			this.animationFrameRequest = null;
		}
		this.renderer.destroy();
	}

	/** Throws when a cold-path engine operation is attempted after destruction. */
	private assertLive(): void {
		if (this.destroyed) {
			throw new Error('The glugglug2 engine has been destroyed.');
		}
	}
}
