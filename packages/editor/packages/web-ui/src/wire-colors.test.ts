import { describe, expect, it, vi } from 'vitest';
import { resolveWireColors } from './wire-colors';

describe('resolveWireColors', () => {
	it('resolves theme CSS colors to normalized line colors', () => {
		let fillStyle = '';
		const pixelsByColor: Record<string, readonly [number, number, number, number]> = {
			'rgba(10, 20, 30, 0.5)': [10, 20, 30, 128],
			'#abcdef': [171, 205, 239, 255],
		};
		const context = {
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			get fillStyle() {
				return fillStyle;
			},
			set fillStyle(color: string | CanvasGradient | CanvasPattern) {
				fillStyle = String(color);
			},
			getImageData: vi.fn(() => ({ data: Uint8ClampedArray.from(pixelsByColor[fillStyle] ?? [0, 0, 0, 0]) })),
		};

		const wireColors = resolveWireColors(
			{
				fill: {
					wire: 'rgba(10, 20, 30, 0.5)',
					wireHighlighted: '#abcdef',
				},
			},
			context
		);

		expect(wireColors).toEqual({
			wire: [10 / 255, 20 / 255, 30 / 255, 128 / 255],
			wireHighlighted: [171 / 255, 205 / 255, 239 / 255, 1],
		});
		expect(context.clearRect).toHaveBeenCalledTimes(2);
		expect(context.fillRect).toHaveBeenCalledTimes(2);
	});
});
