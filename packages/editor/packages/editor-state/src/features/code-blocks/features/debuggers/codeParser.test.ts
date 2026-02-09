import { describe, it, expect } from 'vitest';

import parseDebuggers from './codeParser';

describe('parseDebuggers', () => {
	it('should parse debug instruction with id', () => {
		const code = ['; @debug myVar'];
		const result = parseDebuggers(code);

		expect(result).toEqual([
			{
				id: 'myVar',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple debug instructions', () => {
		const code = ['; @debug var1', 'mov a b', '; @debug var2', 'add c d', '; @debug var3'];
		const result = parseDebuggers(code);

		expect(result).toEqual([
			{
				id: 'var1',
				lineNumber: 0,
			},
			{
				id: 'var2',
				lineNumber: 2,
			},
			{
				id: 'var3',
				lineNumber: 4,
			},
		]);
	});

	it('should return empty array when no debug instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseDebuggers(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseDebuggers(code);

		expect(result).toEqual([]);
	});

	it('should preserve correct line numbers', () => {
		const code = ['nop', 'nop', '; @debug var1', 'nop', 'nop', '; @debug var2'];
		const result = parseDebuggers(code);

		expect(result).toEqual([
			{
				id: 'var1',
				lineNumber: 2,
			},
			{
				id: 'var2',
				lineNumber: 5,
			},
		]);
	});
});
