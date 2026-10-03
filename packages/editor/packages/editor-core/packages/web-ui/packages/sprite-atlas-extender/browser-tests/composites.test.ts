import { Engine } from 'glugglugglug';
import { describe, expect, it } from 'vitest';
import { extendSpriteAtlas } from '../src/index';

describe('composite atlas pixels', () => {
	it('preserves source pixels, top-left orientation, transparency, and ordered drawing in the final engine', () => {
		const source = new OffscreenCanvas(4, 2);
		const context = source.getContext('2d')!;
		context.fillStyle = '#ff0000';
		context.fillRect(0, 0, 1, 1);
		context.fillStyle = '#0000ff';
		context.fillRect(1, 0, 1, 1);
		context.fillStyle = 'rgba(0, 255, 0, 0.5)';
		context.fillRect(2, 0, 1, 1);
		let drawCount = 0;
		const completed = extendSpriteAtlas(
			{
				image: source,
				lookup: {
					red: { x: 0, y: 0, spriteWidth: 1, spriteHeight: 1 },
					blue: { x: 1, y: 0, spriteWidth: 1, spriteHeight: 1 },
					green: { x: 2, y: 0, spriteWidth: 1, spriteHeight: 1 },
				},
			},
			[
				{
					id: 'panel',
					width: 2,
					height: 2,
					draw: (target, sprites) => {
						drawCount++;
						target.drawSprite(0, 0, sprites.resolveSprite('red'));
						target.drawSprite(1, 0, sprites.resolveSprite('green'));
						target.drawSprite(0, 1, sprites.resolveSprite('blue'));
					},
				},
				{
					id: 'empty',
					width: 2,
					height: 2,
					draw: () => {},
				},
			]
		);
		const pixels = completed.image.getContext('2d')!;
		expect([...pixels.getImageData(0, 0, 3, 1).data]).toEqual([...context.getImageData(0, 0, 3, 1).data]);
		expect([...pixels.getImageData(0, 2, 2, 2).data]).toEqual([
			255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 0, 0, 0, 0,
		]);
		expect([...pixels.getImageData(2, 2, 2, 2).data]).toEqual(Array(16).fill(0));

		const canvas = document.createElement('canvas');
		canvas.width = 2;
		canvas.height = 2;
		const engine = new Engine(canvas);
		try {
			const sprites = engine.setSpriteAtlas(completed.image, completed.lookup);
			const panel = sprites.resolveSprite('panel');
			const red = sprites.resolveSprite('red');
			const blue = sprites.resolveSprite('blue');
			const readFrame = () => {
				engine.renderFrame(() => {
					engine.drawSprite(0, 0, red, 2, 2);
					engine.drawSprite(0, 0, panel);
					engine.drawSprite(0, 1, blue, 2, 1);
				});
				const result = new OffscreenCanvas(2, 2).getContext('2d')!;
				result.drawImage(canvas, 0, 0);
				return [...result.getImageData(0, 0, 2, 2).data];
			};
			expect(readFrame()).toEqual([255, 0, 0, 255, 127, 128, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255]);
			engine.releaseRenderingMemory();
			engine.restoreRenderingMemory();
			expect(readFrame()).toEqual([255, 0, 0, 255, 127, 128, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255]);
			expect(drawCount).toBe(1);
		} finally {
			engine.destroy();
			engine.gl.getExtension('WEBGL_lose_context')?.loseContext();
		}
	});
});
