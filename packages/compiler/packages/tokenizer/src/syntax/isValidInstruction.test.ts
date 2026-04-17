import { describe, expect, it } from 'vitest';

import isValidInstruction from './isValidInstruction';

describe('isValidInstruction', () => {
	it('accepts instruction lines', () => {
		expect(isValidInstruction('hello')).toBe(true);
		expect(isValidInstruction('add 1 2')).toBe(true);
		expect(isValidInstruction('hello 10')).toBe(true);
	});

	it('rejects comment-only lines', () => {
		expect(isValidInstruction('; comment')).toBe(false);
	});
});
