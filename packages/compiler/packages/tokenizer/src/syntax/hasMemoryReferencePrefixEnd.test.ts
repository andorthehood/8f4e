import { describe, expect, it } from 'vitest';

import hasMemoryReferencePrefixEnd from './hasMemoryReferencePrefixEnd';

describe('hasMemoryReferencePrefixEnd', () => {
	it('matches when & is at the end', () => {
		expect(hasMemoryReferencePrefixEnd('value&')).toBe(true);
	});

	it('returns false for prefix-only', () => {
		expect(hasMemoryReferencePrefixEnd('&value')).toBe(false);
	});

	it('returns false for plain identifiers', () => {
		expect(hasMemoryReferencePrefixEnd('value')).toBe(false);
	});
});
