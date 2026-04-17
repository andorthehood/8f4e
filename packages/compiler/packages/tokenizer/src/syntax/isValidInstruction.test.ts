import { describe, expect, it } from 'vitest';

import isValidInstruction from './isValidInstruction';

describe('isValidInstruction', () => {
	it('accepts instruction lines', () => {
		expect(isValidInstruction('add 1 2')).toBe(true);
	});

	it('rejects comment-only lines', () => {
		expect(isValidInstruction('; comment')).toBe(false);
	});
});
