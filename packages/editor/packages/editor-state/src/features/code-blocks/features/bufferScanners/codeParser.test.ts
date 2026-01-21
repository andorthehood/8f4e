import { describe, it, expect } from 'vitest';

import parseBufferScanners from './codeParser';

describe('parseBufferScanners', () => {
	it('should parse scan instruction with buffer and pointer', () => {
		const code = ['# scan myBuffer myPointer'];
		const result = parseBufferScanners(code);

		expect(result).toEqual([
			{
				bufferMemoryId: 'myBuffer',
				pointerMemoryId: 'myPointer',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple scan instructions', () => {
		const code = ['# scan buffer1 ptr1', 'mov a b', '# scan buffer2 ptr2'];
		const result = parseBufferScanners(code);

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
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseBufferScanners(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseBufferScanners(code);

		expect(result).toEqual([]);
	});

	it('should parse scan instruction at different line positions', () => {
		const code = ['mov a b', '# scan testBuffer testPointer', 'add c d'];
		const result = parseBufferScanners(code);

		expect(result).toEqual([
			{
				bufferMemoryId: 'testBuffer',
				pointerMemoryId: 'testPointer',
				lineNumber: 1,
			},
		]);
	});
});
