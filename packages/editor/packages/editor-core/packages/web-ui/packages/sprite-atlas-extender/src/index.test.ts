import type { SpriteId } from 'glugglugglug';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type CompositeSprite, extendSpriteAtlas, type SpriteAtlasSource } from './index';

const mocks = vi.hoisted(() => {
	const canvas = { width: 300, height: 150 };
	const copy = vi.fn();
	const loseContext = vi.fn();
	const engine = {
		gl: {
			MAX_TEXTURE_SIZE: 0x0d33,
			getParameter: vi.fn(() => 4096),
			getExtension: vi.fn(() => ({ loseContext })),
		},
		setSpriteAtlas: vi.fn(() => ({ resolveSprite: () => 17 as SpriteId })),
		resize: vi.fn((width: number, height: number) => Object.assign(canvas, { width, height })),
		renderFrame: vi.fn((callback: () => void) => callback()),
		drawSprite: vi.fn(),
		destroy: vi.fn(),
	};
	return { canvas, copy, loseContext, engine };
});

vi.mock('glugglugglug', () => ({
	Engine: class {
		constructor() {
			Object.assign(this, mocks.engine);
		}
	},
}));

const source: SpriteAtlasSource = {
	image: { width: 16, height: 8 } as OffscreenCanvas,
	lookup: { icon: { x: 0, y: 0, spriteWidth: 2, spriteHeight: 3 } },
};

function composite(id: string | number, width = 8, height = 4): CompositeSprite {
	return { id, width, height, draw: vi.fn() };
}

describe('extendSpriteAtlas', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.engine.gl.getParameter.mockReturnValue(4096);
		vi.stubGlobal('document', { createElement: () => mocks.canvas });
		vi.stubGlobal(
			'OffscreenCanvas',
			class {
				constructor(
					public width: number,
					public height: number
				) {}
				getContext() {
					return { drawImage: mocks.copy, imageSmoothingEnabled: true };
				}
			}
		);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('packs shelves below the source, preserves source rectangles, and copies each frame immediately', () => {
		const first = composite('first', 8, 3);
		first.draw = (target, sprites) => target.drawSprite(1, 2, sprites.resolveSprite('icon'));
		const second = composite('second', 8, 5);
		const third = composite('third', 12, 2);
		const completed = extendSpriteAtlas(source, [first, second, third]);

		expect(completed.image).toMatchObject({ width: 16, height: 15 });
		expect(completed.lookup).toEqual({
			icon: source.lookup.icon,
			first: { x: 0, y: 8, spriteWidth: 8, spriteHeight: 3 },
			second: { x: 8, y: 8, spriteWidth: 8, spriteHeight: 5 },
			third: { x: 0, y: 13, spriteWidth: 12, spriteHeight: 2 },
		});
		expect(completed.lookup.icon).not.toBe(source.lookup.icon);
		expect(Object.keys(source.lookup)).toEqual(['icon']);
		expect(source.image).toMatchObject({ width: 16, height: 8 });
		expect(mocks.engine.drawSprite).toHaveBeenCalledWith(1, 2, 17);
		expect(mocks.engine.setSpriteAtlas).toHaveBeenCalledOnce();
		expect(mocks.engine.renderFrame).toHaveBeenCalledTimes(3);
		expect(second.draw).toHaveBeenCalledOnce();
		expect(third.draw).toHaveBeenCalledOnce();
		expect(mocks.copy.mock.calls.map(call => call.slice(1))).toEqual([
			[0, 0],
			[0, 8],
			[8, 8],
			[0, 13],
		]);
		expect(mocks.copy.mock.invocationCallOrder[1]).toBeLessThan(mocks.engine.renderFrame.mock.invocationCallOrder[1]);
		expect(mocks.engine.destroy).toHaveBeenCalledOnce();
		expect(mocks.loseContext).toHaveBeenCalledOnce();
	});

	it('widens the output for a composite larger than the source sheet', () => {
		const completed = extendSpriteAtlas(source, [composite('wide', 24, 4)]);
		expect(completed.image).toMatchObject({ width: 24, height: 12 });
		expect(completed.lookup.icon).toEqual(source.lookup.icon);
	});

	it('copies an unchanged sheet without creating WebGL resources when no composites are requested', () => {
		const completed = extendSpriteAtlas(source, []);
		expect(completed.image).toMatchObject({ width: 16, height: 8 });
		expect(completed.lookup).toEqual(source.lookup);
		expect(mocks.engine.setSpriteAtlas).not.toHaveBeenCalled();
	});

	it('rejects existing keys and normalized numeric duplicates before drawing', () => {
		expect(() => extendSpriteAtlas(source, [composite('icon')])).toThrow('Duplicate sprite identifier');
		expect(() => extendSpriteAtlas(source, [composite(7), composite('7')])).toThrow('Duplicate sprite identifier');
		expect(mocks.engine.renderFrame).not.toHaveBeenCalled();
	});

	it('handles prototype-like public keys as ordinary own lookup entries', () => {
		const completed = extendSpriteAtlas(source, [composite('__proto__')]);
		expect(Object.hasOwn(completed.lookup, '__proto__')).toBe(true);
		expect(Object.getOwnPropertyDescriptor(completed.lookup, '__proto__')?.value).toEqual({
			x: 0,
			y: 8,
			spriteWidth: 8,
			spriteHeight: 4,
		});
	});

	it.each([0, -1, 1.5, NaN, Infinity, 65536])('rejects invalid composite dimensions: %s', width => {
		expect(() => extendSpriteAtlas(source, [composite('bad', width)])).toThrow('positive uint16');
		expect(mocks.engine.renderFrame).not.toHaveBeenCalled();
	});

	it('rejects GPU capacity overflow and still releases the temporary engine', () => {
		mocks.engine.gl.getParameter.mockReturnValue(16);
		expect(() => extendSpriteAtlas(source, [composite('tall', 8, 12)])).toThrow('GPU texture limit');
		expect(mocks.engine.setSpriteAtlas).not.toHaveBeenCalled();
		expect(mocks.engine.destroy).toHaveBeenCalledOnce();
	});

	it('releases the temporary engine when a drawing callback fails', () => {
		const item = composite('broken');
		item.draw = () => {
			throw new Error('Drawing failed');
		};
		expect(() => extendSpriteAtlas(source, [item])).toThrow('Drawing failed');
		expect(mocks.copy).toHaveBeenCalledTimes(1);
		expect(mocks.engine.destroy).toHaveBeenCalledOnce();
		expect(mocks.loseContext).toHaveBeenCalledOnce();
	});

	it('rejects async drawing callbacks instead of returning incomplete pixels', () => {
		const item = composite('async');
		item.draw = async () => {};
		expect(() => extendSpriteAtlas(source, [item])).toThrow('must run synchronously');
		expect(mocks.engine.destroy).toHaveBeenCalledOnce();
	});
});
