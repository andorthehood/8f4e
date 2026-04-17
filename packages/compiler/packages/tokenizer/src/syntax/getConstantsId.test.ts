import { describe, expect, it } from 'vitest';

import getConstantsId from './getConstantsId';

describe('getConstantsId', () => {
	it('returns the constants identifier', () => {
		expect(getConstantsId(['constants math', 'constantsEnd'])).toBe('math');
	});

	it('returns empty string when missing', () => {
		expect(getConstantsId(['module foo', 'moduleEnd'])).toBe('');
	});
});
