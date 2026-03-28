import { describe, it, expect } from 'vitest';

import { createPlotDirectiveData } from './data';
import plotDirective from './plugin';

import { parseEditorDirectives } from '../utils';

function parsePlotDirectiveData(code: string[]) {
	return parseEditorDirectives(code, [plotDirective]).map(directive =>
		createPlotDirectiveData(directive.args, directive.rawRow)
	);
}

describe('plot directive data', () => {
	it('should parse plot instruction with all arguments', () => {
		const code = ['; @plot myArray -10 10 arrayLength'];
		const result = parsePlotDirectiveData(code);

		expect(result).toEqual([
			{
				arrayMemoryId: 'myArray',
				lineNumber: 0,
				minValue: -10,
				maxValue: 10,
				arrayLengthMemoryId: 'arrayLength',
			},
		]);
	});

	it('should parse plot instruction with default min/max values', () => {
		const code = ['; @plot myArray'];
		const result = parsePlotDirectiveData(code);

		expect(result).toEqual([
			{
				arrayMemoryId: 'myArray',
				lineNumber: 0,
				minValue: -8,
				maxValue: 8,
				arrayLengthMemoryId: undefined,
			},
		]);
	});

	it('should parse plot instruction without array length', () => {
		const code = ['; @plot myArray -5 5'];
		const result = parsePlotDirectiveData(code);

		expect(result).toEqual([
			{
				arrayMemoryId: 'myArray',
				lineNumber: 0,
				minValue: -5,
				maxValue: 5,
				arrayLengthMemoryId: undefined,
			},
		]);
	});

	it('should handle multiple plot instructions', () => {
		const code = ['; @plot buffer1 -10 10', 'mov a b', '; @plot buffer2 -8 100 len2'];
		const result = parsePlotDirectiveData(code);

		expect(result).toEqual([
			{
				arrayMemoryId: 'buffer1',
				lineNumber: 0,
				minValue: -10,
				maxValue: 10,
				arrayLengthMemoryId: undefined,
			},
			{
				arrayMemoryId: 'buffer2',
				lineNumber: 2,
				minValue: -8,
				maxValue: 100,
				arrayLengthMemoryId: 'len2',
			},
		]);
	});

	it('should return empty array when no plot instructions found', () => {
		const result = parsePlotDirectiveData(['mov a b', 'add c d', 'sub e f']);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		expect(parsePlotDirectiveData([])).toEqual([]);
	});

	it('should use default values when min/max are invalid numbers', () => {
		const result = parsePlotDirectiveData(['; @plot myArray invalid invalid']);

		expect(result).toEqual([
			{
				arrayMemoryId: 'myArray',
				lineNumber: 0,
				minValue: -8,
				maxValue: 8,
				arrayLengthMemoryId: undefined,
			},
		]);
	});

	it('should preserve 0 values for min/max', () => {
		const result = parsePlotDirectiveData(['; @plot myArray 0 255']);

		expect(result).toEqual([
			{
				arrayMemoryId: 'myArray',
				lineNumber: 0,
				minValue: 0,
				maxValue: 255,
				arrayLengthMemoryId: undefined,
			},
		]);
	});
});
