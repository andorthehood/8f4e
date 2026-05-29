import { test, expect } from 'vitest';

import compile from '../../src';

test('constants block expressions are available through use', () => {
	const result = compile(
		{
			entries: {
				main: [
					{
						code: ['module test', 'use env', 'int output HALF', 'moduleEnd'],
					},
				],
			},
			constants: [
				{
					code: ['constants env', 'const SIZE 8', 'const HALF SIZE/2', 'constantsEnd'],
				},
			],
		},
		{ startingMemoryWordAddress: 0 }
	);

	expect(result.compiledModules.test.memoryMap.output.default).toBe(4);
});
