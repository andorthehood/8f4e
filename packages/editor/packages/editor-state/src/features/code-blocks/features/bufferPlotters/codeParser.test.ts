import { describe, it, expect } from 'vitest';

import parseBufferPlotters from './codeParser';

describe('parseBufferPlotters', () => {
	it('should parse plot instruction with all arguments', () => {
		const code = ['# plot myBuffer -10 10 bufferLength'];
		const result = parseBufferPlotters(code);

		expect(result).toEqual([
			{
				bufferMemoryId: 'myBuffer',
				lineNumber: 0,
				minValue: -10,
				maxValue: 10,
				bufferLengthMemoryId: 'bufferLength',
			},
		]);
	});

	it('should parse plot instruction with default min/max values', () => {
		const code = ['# plot myBuffer'];
		const result = parseBufferPlotters(code);

		expect(result).toEqual([
			{
				bufferMemoryId: 'myBuffer',
				lineNumber: 0,
				minValue: -8,
				maxValue: 8,
				bufferLengthMemoryId: undefined,
			},
		]);
	});

	it('should parse plot instruction without buffer length', () => {
		const code = ['# plot myBuffer -5 5'];
		const result = parseBufferPlotters(code);

		expect(result).toEqual([
			{
				bufferMemoryId: 'myBuffer',
				lineNumber: 0,
				minValue: -5,
				maxValue: 5,
				bufferLengthMemoryId: undefined,
			},
		]);
	});

	it('should handle multiple plot instructions', () => {
		const code = ['# plot buffer1 -10 10', 'mov a b', '# plot buffer2 -8 100 len2'];
		const result = parseBufferPlotters(code);

		expect(result).toEqual([
			{
				bufferMemoryId: 'buffer1',
				lineNumber: 0,
				minValue: -10,
				maxValue: 10,
				bufferLengthMemoryId: undefined,
			},
			{
				bufferMemoryId: 'buffer2',
				lineNumber: 2,
				minValue: -8,
				maxValue: 100,
				bufferLengthMemoryId: 'len2',
			},
		]);
	});

	it('should return empty array when no plot instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseBufferPlotters(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseBufferPlotters(code);

		expect(result).toEqual([]);
	});

	it('should use default values when min/max are invalid numbers', () => {
		const code = ['# plot myBuffer invalid invalid'];
		const result = parseBufferPlotters(code);

		expect(result).toEqual([
			{
				bufferMemoryId: 'myBuffer',
				lineNumber: 0,
				minValue: -8,
				maxValue: 8,
				bufferLengthMemoryId: undefined,
			},
		]);
	});
});
