import { describe, it, expect } from 'vitest';
import { parsePressedKeys } from './parsePressedKeys';

describe('parsePressedKeys', () => {
	it('should return empty set when no keys are pressed', () => {
		const code = ['mov a b', 'add c d'];
		const result = parsePressedKeys(code, 'keys', 60);

		expect(result.size).toBe(0);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parsePressedKeys(code, 'keys', 60);

		expect(result.size).toBe(0);
	});

	it('should return a Set instance', () => {
		const code = ['init keys[0] 60'];
		const result = parsePressedKeys(code, 'keys', 60);

		expect(result).toBeInstanceOf(Set);
	});
});

