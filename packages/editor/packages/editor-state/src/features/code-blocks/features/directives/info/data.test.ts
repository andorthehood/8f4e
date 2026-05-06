import { describe, expect, it } from 'vitest';

import { createInfoDirectiveData } from './data';

describe('info directive data', () => {
	it('uses the first argument as the state.info key', () => {
		expect(createInfoDirectiveData(['foo'], 3)).toEqual({ id: 'foo', lineNumber: 3 });
	});

	it('ignores malformed info directives without an id', () => {
		expect(createInfoDirectiveData([], 3)).toBeUndefined();
	});
});
