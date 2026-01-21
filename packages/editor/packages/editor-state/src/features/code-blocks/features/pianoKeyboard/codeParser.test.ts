import { describe, it, expect, vi } from 'vitest';

import parsePianoKeyboards from './codeParser';

// Mock parsePressedKeys
vi.mock('./parsePressedKeys', () => ({
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	default: vi.fn((_code, memoryId, _startingNumber) => {
		const keys = new Set<number>();
		if (memoryId === 'keys1') {
			keys.add(0);
			keys.add(2);
		}
		return keys;
	}),
}));

describe('parsePianoKeyboards', () => {
	it('should parse piano instruction with all arguments', () => {
		const code = ['# piano keys1 numKeys 60'];
		const result = parsePianoKeyboards(code);

		expect(result).toEqual([
			{
				id: 'keys1',
				lineNumber: 0,
				pressedNumberOfKeysMemoryId: 'numKeys',
				pressedKeysListMemoryId: 'keys1',
				startingNumber: 60,
				pressedKeys: expect.any(Set),
			},
		]);
	});

	it('should parse piano instruction with default starting number', () => {
		const code = ['# piano keys1 numKeys'];
		const result = parsePianoKeyboards(code);

		expect(result).toEqual([
			{
				id: 'keys1',
				lineNumber: 0,
				pressedNumberOfKeysMemoryId: 'numKeys',
				pressedKeysListMemoryId: 'keys1',
				startingNumber: 0,
				pressedKeys: expect.any(Set),
			},
		]);
	});

	it('should handle multiple piano instructions', () => {
		const code = ['# piano keys1 numKeys1 60', 'mov a b', '# piano keys2 numKeys2 48'];
		const result = parsePianoKeyboards(code);

		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('keys1');
		expect(result[0].lineNumber).toBe(0);
		expect(result[0].startingNumber).toBe(60);
		expect(result[1].id).toBe('keys2');
		expect(result[1].lineNumber).toBe(2);
		expect(result[1].startingNumber).toBe(48);
	});

	it('should return empty array when no piano instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parsePianoKeyboards(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parsePianoKeyboards(code);

		expect(result).toEqual([]);
	});

	it('should parse starting number as integer', () => {
		const code = ['# piano keys1 numKeys 60.5'];
		const result = parsePianoKeyboards(code);

		expect(result[0].startingNumber).toBe(60); // parseInt should truncate
	});

	it('should return NaN for invalid starting number', () => {
		const code = ['# piano keys1 numKeys invalid'];
		const result = parsePianoKeyboards(code);

		expect(result[0].startingNumber).toBe(NaN);
	});

	it('should preserve correct line numbers', () => {
		const code = ['nop', 'nop', '# piano keys1 numKeys 60', 'nop', 'nop', '# piano keys2 numKeys2 48'];
		const result = parsePianoKeyboards(code);

		expect(result[0].lineNumber).toBe(2);
		expect(result[1].lineNumber).toBe(5);
	});
});
