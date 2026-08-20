import type { SpriteIdLookup } from '@8f4e/sprite-generator';
import { vi } from 'vitest';
import type { DrawContext } from '../drawContext';

/** Creates a semantic lookup whose property names remain visible in drawer assertions. */
export function createSpriteIdLookupMock(): SpriteIdLookup {
	return new Proxy(
		{},
		{
			get: (target, key) => {
				if (typeof key === 'symbol') {
					return Reflect.get(target, key);
				}
				const numericKey = Number(key);
				return Number.isNaN(numericKey) ? key : numericKey;
			},
		}
	) as SpriteIdLookup;
}

/** Creates the reusable numeric drawing surface expected by unit-scoped drawer tests. */
export function createDrawContextMock(): DrawContext {
	return {
		startGroup: vi.fn(),
		endGroup: vi.fn(),
		cacheGroup: vi.fn((_key, _width, _height, draw) => {
			draw();
			return false;
		}),
		drawSprite: vi.fn(),
		drawText: vi.fn(),
	} as unknown as DrawContext;
}
