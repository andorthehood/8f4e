import { describe, expect, it } from 'vitest';

import extractMemoryReferenceBase from './extractMemoryReferenceBase';

describe('extractMemoryReferenceBase', () => {
	it('removes prefix', () => {
		expect(extractMemoryReferenceBase('&value')).toBe('value');
	});

	it('removes suffix', () => {
		expect(extractMemoryReferenceBase('value&')).toBe('value');
	});

	it('leaves plain identifiers unchanged', () => {
		expect(extractMemoryReferenceBase('value')).toBe('value');
	});
});
