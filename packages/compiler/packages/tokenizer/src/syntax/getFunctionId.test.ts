import { describe, expect, it } from 'vitest';

import getFunctionId from './getFunctionId';

describe('getFunctionId', () => {
	it('returns the function identifier', () => {
		expect(getFunctionId(['function foo', 'functionEnd'])).toBe('foo');
	});

	it('returns empty string when missing', () => {
		expect(getFunctionId(['module foo', 'moduleEnd'])).toBe('');
	});
});
