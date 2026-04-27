import { describe, expect, it } from 'vitest';

import extractPointeeMemoryReferenceEndBase from './extractPointeeMemoryReferenceEndBase';

describe('extractPointeeMemoryReferenceEndBase', () => {
	it('strips the * prefix and & suffix from *name&', () => {
		expect(extractPointeeMemoryReferenceEndBase('*buffer&')).toBe('buffer');
	});

	it('handles short identifiers', () => {
		expect(extractPointeeMemoryReferenceEndBase('*x&')).toBe('x');
	});

	it('leaves plain identifiers unchanged', () => {
		expect(extractPointeeMemoryReferenceEndBase('buffer')).toBe('buffer');
	});

	it('leaves *name (no trailing &) unchanged', () => {
		expect(extractPointeeMemoryReferenceEndBase('*buffer')).toBe('*buffer');
	});

	it('leaves name& (no leading *) unchanged', () => {
		expect(extractPointeeMemoryReferenceEndBase('buffer&')).toBe('buffer&');
	});
});
