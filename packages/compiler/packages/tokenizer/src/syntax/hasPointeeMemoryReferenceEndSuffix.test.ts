import { describe, expect, it } from 'vitest';

import hasPointeeMemoryReferenceEndSuffix from './hasPointeeMemoryReferenceEndSuffix';

describe('hasPointeeMemoryReferenceEndSuffix', () => {
	it('matches the *name& form', () => {
		expect(hasPointeeMemoryReferenceEndSuffix('*buffer&')).toBe(true);
	});

	it('matches *ptr& form', () => {
		expect(hasPointeeMemoryReferenceEndSuffix('*ptr&')).toBe(true);
	});

	it('returns false for plain dereference *name (no trailing &)', () => {
		expect(hasPointeeMemoryReferenceEndSuffix('*buffer')).toBe(false);
	});

	it('returns false for end-address suffix name& (no leading *)', () => {
		expect(hasPointeeMemoryReferenceEndSuffix('buffer&')).toBe(false);
	});

	it('returns false for start-address prefix &name', () => {
		expect(hasPointeeMemoryReferenceEndSuffix('&buffer')).toBe(false);
	});

	it('returns false for plain identifier', () => {
		expect(hasPointeeMemoryReferenceEndSuffix('buffer')).toBe(false);
	});

	it('returns false for the degenerate two-character case *&', () => {
		expect(hasPointeeMemoryReferenceEndSuffix('*&')).toBe(false);
	});
});
