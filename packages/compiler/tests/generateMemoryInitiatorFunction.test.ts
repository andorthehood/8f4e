import { describe, test, expect } from 'vitest';

import modules from './__fixtures__/modules';

import { compileToAST } from '../src/compiler';
import { compileModules, generateMemoryInitiatorFunctions } from '../src';

describe('compiler', () => {
	test('generateMemoryInitiatorFunction', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		const compiledModules = compileModules(astModules, {
			startingMemoryWordAddress: 0,

			memorySizeBytes: 65536,
		});
		expect(generateMemoryInitiatorFunctions(compiledModules)).toMatchSnapshot();
	});
});
