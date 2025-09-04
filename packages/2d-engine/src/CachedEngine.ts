import { Engine } from './engine';

/**
 * @deprecated Use Engine with { caching: true } instead.
 * CachedEngine extends the base Engine to use CachedRenderer for improved performance
 * when drawing complex or frequently-used content.
 */
export class CachedEngine extends Engine {
	constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
		// Use the unified Engine constructor with caching enabled
		super(canvas, { caching: true, maxCacheItems });
	}
}
