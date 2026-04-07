import { describe, expect, test } from 'vitest';

import compile from '../src';

describe('reserved identifiers', () => {
	test('rejects memory declarations named this', () => {
		const modules = [{ code: ['module sourceModule', 'int this', 'moduleEnd'] }];

		expect(() =>
			compile(modules, {
				startingMemoryWordAddress: 0,
			})
		).toThrow(/this/);
	});
});
