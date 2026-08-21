import { describe, expect, it } from 'vitest';

import hasMemoryReferencePrefix from './hasMemoryReferencePrefix';

describe('hasMemoryReferencePrefix', () => {
	it('detects prefix', () => {
		expect(hasMemoryReferencePrefix('&value')).toBe(true);
	});

	it('detects suffix', () => {
		expect(hasMemoryReferencePrefix('value&')).toBe(true);
	});

	it('returns false for plain identifiers', () => {
		expect(hasMemoryReferencePrefix('value')).toBe(false);
	});
});
