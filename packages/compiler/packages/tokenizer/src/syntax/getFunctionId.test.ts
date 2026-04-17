import { describe, expect, it } from 'vitest';

import getFunctionId from './getFunctionId';

describe('getFunctionId', () => {
	it('returns the function identifier', () => {
		expect(getFunctionId(['function foo', 'functionEnd'])).toBe('foo');
	});

	it('returns empty string when missing', () => {
		expect(getFunctionId(['module foo', 'moduleEnd'])).toBe('');
	});

	it('returns empty string if no function instruction is present', () => {
		expect(getFunctionId(['int x 5', 'add'])).toBe('');
	});
});
