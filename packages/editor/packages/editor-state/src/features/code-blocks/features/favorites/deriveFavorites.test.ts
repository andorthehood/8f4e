import { describe, it, expect } from 'vitest';

import deriveFavorites from './deriveFavorites';

import type { CodeBlockGraphicData } from '../../types';

// Helper to create a minimal mock code block
function mockCodeBlock(
	creationIndex: number,
	id: string,
	blockType: string,
	isFavorite: boolean
): CodeBlockGraphicData {
	return {
		creationIndex,
		id,
		blockType,
		isFavorite,
		code: [],
		// Minimal required properties
		gridX: 0,
		gridY: 0,
		width: 100,
		height: 100,
		x: 0,
		y: 0,
		offsetX: 0,
		offsetY: 0,
		disabled: false,
		isHome: false,
		lastUpdated: 0,
		widgets: {
			blockHighlights: [],
			inputs: [],
			outputs: [],
			debuggers: [],
			arrayPlotters: [],
			arrayMeters: [],
			arrayWaves: [],
			switches: [],
			buttons: [],
			sliders: [],
			pianoKeyboards: [],
			errorMessages: [],
		},
	} as CodeBlockGraphicData;
}

describe('deriveFavorites', () => {
	it('should return empty array for no code blocks', () => {
		expect(deriveFavorites([])).toEqual([]);
	});

	it('should return empty array when no blocks have @favorite', () => {
		const blocks = [mockCodeBlock(0, 'module1', 'module', false), mockCodeBlock(1, 'func1', 'function', false)];
		expect(deriveFavorites(blocks)).toEqual([]);
	});

	it('should return single favorite', () => {
		const blocks = [mockCodeBlock(0, 'osc', 'module', true)];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([{ creationIndex: 0, id: 'osc', blockType: 'module' }]);
	});

	it('should return multiple favorites', () => {
		const blocks = [
			mockCodeBlock(0, 'osc', 'module', true),
			mockCodeBlock(1, 'filter', 'module', false),
			mockCodeBlock(2, 'mix', 'function', true),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([
			{ creationIndex: 0, id: 'osc', blockType: 'module' },
			{ creationIndex: 2, id: 'mix', blockType: 'function' },
		]);
	});

	it('should sort favorites by creationIndex', () => {
		const blocks = [
			mockCodeBlock(5, 'c', 'module', true),
			mockCodeBlock(1, 'a', 'module', true),
			mockCodeBlock(3, 'b', 'function', true),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([
			{ creationIndex: 1, id: 'a', blockType: 'module' },
			{ creationIndex: 3, id: 'b', blockType: 'function' },
			{ creationIndex: 5, id: 'c', blockType: 'module' },
		]);
	});

	it('should deduplicate by creationIndex', () => {
		// This shouldn't happen in practice, but handles edge case
		const blocks = [mockCodeBlock(0, 'osc', 'module', true), mockCodeBlock(0, 'osc', 'module', true)];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([{ creationIndex: 0, id: 'osc', blockType: 'module' }]);
	});

	it('should handle duplicate ids with different creationIndices', () => {
		const blocks = [mockCodeBlock(0, 'osc', 'module', true), mockCodeBlock(1, 'osc', 'module', true)];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([
			{ creationIndex: 0, id: 'osc', blockType: 'module' },
			{ creationIndex: 1, id: 'osc', blockType: 'module' },
		]);
	});

	it('should handle all block types', () => {
		const blocks = [
			mockCodeBlock(0, 'mod', 'module', true),
			mockCodeBlock(1, 'fn', 'function', true),
			mockCodeBlock(2, 'note', 'note', true),
			mockCodeBlock(4, 'consts', 'constants', true),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([
			{ creationIndex: 0, id: 'mod', blockType: 'module' },
			{ creationIndex: 1, id: 'fn', blockType: 'function' },
			{ creationIndex: 2, id: 'note', blockType: 'note' },
			{ creationIndex: 4, id: 'consts', blockType: 'constants' },
		]);
	});

	it('should not count non-favorite blocks', () => {
		const blocks = [
			mockCodeBlock(0, 'a', 'module', false),
			mockCodeBlock(1, 'b', 'module', true),
			mockCodeBlock(2, 'c', 'module', false),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([{ creationIndex: 1, id: 'b', blockType: 'module' }]);
	});
});
