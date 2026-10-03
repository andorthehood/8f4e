import { afterEach, describe, expect, it, vi } from 'vitest';
import generateIconPrimitives, { generateLookup, getFeedbackGlyphColors } from '../src/icon-primitives';
import generateSprite, { defaultColorScheme } from '../src/index';
import { Command } from '../src/types';

afterEach(() => vi.unstubAllGlobals());

describe('icon primitives', () => {
	it('draws only single-cell fills and individual font glyphs', () => {
		const ascii = Array(128 * 16).fill(0);
		const glyphs = Array(19 * 16).fill(0);
		ascii['['.charCodeAt(0) * 16] = 0b10000000;
		ascii[']'.charCodeAt(0) * 16] = 0b00000001;
		ascii['*'.charCodeAt(0) * 16] = 0b00010000;
		glyphs[6 * 16 + 2] = 0b00100000;
		const commands = generateIconPrimitives(ascii, glyphs, 8, 16, defaultColorScheme.icons);
		expect(commands.filter(command => command[0] === Command.RECTANGLE)).toEqual(
			Array(3).fill([Command.RECTANGLE, 0, 0, 8, 16])
		);
		expect(commands.filter(command => command[0] === Command.PIXEL)).toEqual([
			[Command.PIXEL, 0, 0],
			[Command.PIXEL, 7, 0],
			[Command.PIXEL, 2, 2],
			[Command.PIXEL, 0, 0],
			[Command.PIXEL, 7, 0],
			...Array(6).fill([Command.PIXEL, 3, 0]),
		]);
		for (const group of Object.values(generateLookup(8, 16, defaultColorScheme.icons))) {
			for (const coordinates of Object.values(group)) {
				expect(coordinates).toMatchObject({ spriteWidth: 8, spriteHeight: 16 });
			}
		}
	});

	it('compacts nonempty feedback colors in their theme order', () => {
		const colors = {
			...defaultColorScheme.icons,
			feedbackScale0: '',
			feedbackScale1: '#abcdef',
			feedbackScale2: ' ',
			feedbackScale3: '#fedcba',
			feedbackScale4: '',
			feedbackScale5: '',
		};
		expect(getFeedbackGlyphColors(colors)).toEqual(['#abcdef', '#fedcba']);
		const { feedbackGlyphs } = generateLookup(6, 10, colors);
		expect(Object.keys(feedbackGlyphs)).toEqual(['0', '1']);
		expect(feedbackGlyphs[1]!.x - feedbackGlyphs[0]!.x).toBe(6);
		expect(feedbackGlyphs[0]).toMatchObject({ spriteWidth: 6, spriteHeight: 10 });
	});

	it('emits base groups only and requires a feedback fallback glyph', async () => {
		vi.stubGlobal(
			'OffscreenCanvas',
			class {
				constructor(
					public width: number,
					public height: number
				) {}
				getContext() {
					return { fillStyle: '', fillRect() {}, resetTransform() {}, translate() {}, save() {}, restore() {} };
				}
			}
		);
		const { spriteAtlas } = await generateSprite({ font: '6x10' });
		expect(spriteAtlas.spriteIdentifiers).not.toHaveProperty('background');
		expect(spriteAtlas.spriteIdentifiers).not.toHaveProperty('icons');
		expect(spriteAtlas.spriteIdentifiers).not.toHaveProperty('feedbackScale');
		expect(spriteAtlas.spriteIdentifiers.feedbackGlyphs[0]).toBeDefined();
		const coordinates = spriteAtlas.lookup[spriteAtlas.spriteIdentifiers.iconGlyphs.switchKnob];
		expect(coordinates).toMatchObject({ spriteWidth: 6, spriteHeight: 10 });
		await expect(
			generateSprite({
				colorScheme: {
					icons: {
						feedbackScale0: '',
						feedbackScale1: '',
						feedbackScale2: '',
						feedbackScale3: '',
						feedbackScale4: '',
						feedbackScale5: '',
					},
				},
			})
		).rejects.toThrow('Generated feedback glyphs are missing fallback sprite 0.');
	});
});
