import { describe, expect, it } from 'vitest';

import getModuleId from './getModuleId';

describe('getModuleId', () => {
	it('returns the module identifier', () => {
		expect(getModuleId(['module foo', 'moduleEnd'])).toBe('foo');
	});

	it('returns empty string when missing', () => {
		expect(getModuleId(['function foo', 'functionEnd'])).toBe('');
	});
});
