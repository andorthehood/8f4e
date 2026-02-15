import { describe, it, expect } from 'vitest';

import deriveFavorites from './deriveFavorites';

import type { CodeBlockGraphicData } from '../../types';

// Helper to create a minimal mock code block
function mockCodeBlock(creationIndex: number, id: string, blockType: string, code: string[]): CodeBlockGraphicData {
	return {
		creationIndex,
		id,
		blockType,
		code,
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
		lastUpdated: 0,
		extras: {
			blockHighlights: [],
			inputs: [],
			outputs: [],
			debuggers: [],
			bufferPlotters: [],
			bufferScanners: [],
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
		const blocks = [
			mockCodeBlock(0, 'module1', 'module', ['module module1', 'moduleEnd']),
			mockCodeBlock(1, 'func1', 'function', ['function func1', 'functionEnd']),
		];
		expect(deriveFavorites(blocks)).toEqual([]);
	});

	it('should return single favorite', () => {
		const blocks = [mockCodeBlock(0, 'osc', 'module', ['module osc', '; @favorite', 'output out 1', 'moduleEnd'])];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([{ creationIndex: 0, id: 'osc', blockType: 'module' }]);
	});

	it('should return multiple favorites', () => {
		const blocks = [
			mockCodeBlock(0, 'osc', 'module', ['module osc', '; @favorite', 'moduleEnd']),
			mockCodeBlock(1, 'filter', 'module', ['module filter', 'moduleEnd']),
			mockCodeBlock(2, 'mix', 'function', ['function mix', '; @favorite', 'functionEnd']),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([
			{ creationIndex: 0, id: 'osc', blockType: 'module' },
			{ creationIndex: 2, id: 'mix', blockType: 'function' },
		]);
	});

	it('should sort favorites by creationIndex', () => {
		const blocks = [
			mockCodeBlock(5, 'c', 'module', ['module c', '; @favorite', 'moduleEnd']),
			mockCodeBlock(1, 'a', 'module', ['module a', '; @favorite', 'moduleEnd']),
			mockCodeBlock(3, 'b', 'function', ['function b', '; @favorite', 'functionEnd']),
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
		const blocks = [
			mockCodeBlock(0, 'osc', 'module', ['module osc', '; @favorite', 'moduleEnd']),
			mockCodeBlock(0, 'osc', 'module', ['module osc', '; @favorite', 'moduleEnd']),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([{ creationIndex: 0, id: 'osc', blockType: 'module' }]);
	});

	it('should handle duplicate ids with different creationIndices', () => {
		const blocks = [
			mockCodeBlock(0, 'osc', 'module', ['module osc', '; @favorite', 'moduleEnd']),
			mockCodeBlock(1, 'osc', 'module', ['module osc', '; @favorite', 'moduleEnd']),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([
			{ creationIndex: 0, id: 'osc', blockType: 'module' },
			{ creationIndex: 1, id: 'osc', blockType: 'module' },
		]);
	});

	it('should handle all block types', () => {
		const blocks = [
			mockCodeBlock(0, 'mod', 'module', ['module mod', '; @favorite', 'moduleEnd']),
			mockCodeBlock(1, 'fn', 'function', ['function fn', '; @favorite', 'functionEnd']),
			mockCodeBlock(2, 'vs', 'vertexShader', ['vertexShader vs', '; @favorite', 'vertexShaderEnd']),
			mockCodeBlock(3, 'fs', 'fragmentShader', ['fragmentShader fs', '; @favorite', 'fragmentShaderEnd']),
			mockCodeBlock(4, 'note', 'comment', ['comment', '; @favorite', 'commentEnd']),
			mockCodeBlock(5, 'cfg', 'config', ['config', '; @favorite', 'configEnd']),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([
			{ creationIndex: 0, id: 'mod', blockType: 'module' },
			{ creationIndex: 1, id: 'fn', blockType: 'function' },
			{ creationIndex: 2, id: 'vs', blockType: 'vertexShader' },
			{ creationIndex: 3, id: 'fs', blockType: 'fragmentShader' },
			{ creationIndex: 4, id: 'note', blockType: 'comment' },
			{ creationIndex: 5, id: 'cfg', blockType: 'config' },
		]);
	});

	it('should handle @favorite at different positions in code', () => {
		const blocks = [
			mockCodeBlock(0, 'a', 'module', ['; @favorite', 'module a', 'moduleEnd']),
			mockCodeBlock(1, 'b', 'module', ['module b', 'moduleEnd', '; @favorite']),
			mockCodeBlock(2, 'c', 'module', ['module c', 'output out 1', '; @favorite', 'moduleEnd']),
		];
		const result = deriveFavorites(blocks);
		expect(result.length).toBe(3);
	});

	it('should not count multiple @favorite directives in same block multiple times', () => {
		const blocks = [
			mockCodeBlock(0, 'osc', 'module', ['module osc', '; @favorite', 'output out 1', '; @favorite', 'moduleEnd']),
		];
		const result = deriveFavorites(blocks);
		expect(result).toEqual([{ creationIndex: 0, id: 'osc', blockType: 'module' }]);
	});
});
