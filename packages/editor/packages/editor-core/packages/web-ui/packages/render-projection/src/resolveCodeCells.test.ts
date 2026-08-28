import type { SpriteFont, SpriteId } from '@8f4e/sprite-generator';
import { describe, expect, it } from 'vitest';
import resolveCodeCells from './resolveCodeCells';

const spriteId = (value: number): SpriteId => value as SpriteId;

function createFont(fallback: number, glyphs: Record<string | number, number> = {}): SpriteFont {
	return {
		63: spriteId(fallback),
		...Object.fromEntries(Object.entries(glyphs).map(([character, id]) => [character, spriteId(id)])),
	} as SpriteFont;
}

describe('resolveCodeCells', () => {
	it('resolves glyphs, preserves font transitions, and advances over spaces', () => {
		const defaultFont = createFont(90, { 65: 1, 66: 2 });
		const syntaxFont = createFont(91, { 66: 12, 67: 13 });

		expect(resolveCodeCells([[65, 32, 66, 67]], [[undefined, syntaxFont]], defaultFont)).toEqual([
			[spriteId(1), null, spriteId(12), spriteId(13)],
		]);
	});

	it('uses the active font fallback for unknown glyphs', () => {
		const defaultFont = createFont(90);
		const syntaxFont = createFont(91);

		expect(resolveCodeCells([['unknown']], [[syntaxFont]], defaultFont)).toEqual([[spriteId(91)]]);
	});

	it('uses the disabled font for every non-space cell and ignores syntax transitions', () => {
		const defaultFont = createFont(90, { 65: 1 });
		const syntaxFont = createFont(91, { 65: 11 });
		const disabledFont = createFont(92, { 65: 21 });

		expect(resolveCodeCells([[65, 32, 65]], [[syntaxFont]], defaultFont, disabledFont)).toEqual([
			[spriteId(21), null, spriteId(21)],
		]);
	});

	it('resolves rows independently from the default font', () => {
		const defaultFont = createFont(90, { 65: 1 });
		const syntaxFont = createFont(91, { 65: 11 });

		expect(resolveCodeCells([[65], [65]], [[syntaxFont], []], defaultFont)).toEqual([[spriteId(11)], [spriteId(1)]]);
	});
});
