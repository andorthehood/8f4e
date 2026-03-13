import { describe, it, expect } from 'vitest';

import parseScanDirectives from './parse';

describe('parseScanDirectives', () => {
	it('should parse scan instruction with buffer and pointer', () => {
		const result = parseScanDirectives(['; @scan myBuffer myPointer']);

		expect(result).toEqual([
			{
				bufferMemoryId: 'myBuffer',
				pointerMemoryId: 'myPointer',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple scan instructions', () => {
		const result = parseScanDirectives(['; @scan buffer1 ptr1', 'mov a b', '; @scan buffer2 ptr2']);

		expect(result).toEqual([
			{
				bufferMemoryId: 'buffer1',
				pointerMemoryId: 'ptr1',
				lineNumber: 0,
			},
			{
				bufferMemoryId: 'buffer2',
				pointerMemoryId: 'ptr2',
				lineNumber: 2,
			},
		]);
	});

	it('should return empty array when no scan instructions found', () => {
		expect(parseScanDirectives(['mov a b', 'add c d', 'sub e f'])).toEqual([]);
	});

	it('should handle empty code array', () => {
		expect(parseScanDirectives([])).toEqual([]);
	});

	it('should parse scan instruction at different line positions', () => {
		const result = parseScanDirectives(['mov a b', '; @scan testBuffer testPointer', 'add c d']);

		expect(result).toEqual([
			{
				bufferMemoryId: 'testBuffer',
				pointerMemoryId: 'testPointer',
				lineNumber: 1,
			},
		]);
	});
});
