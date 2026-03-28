import { compileToAST } from '@8f4e/tokenizer';
import { describe, test, expect } from 'vitest';

import modules from './__fixtures__/modules';

import { compileModules, generateMemoryInitiatorFunctions } from '../src';

describe('compiler', () => {
	test('generateMemoryInitiatorFunction', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		const compiledModules = compileModules(astModules, {
			startingMemoryWordAddress: 0,
		});
		expect(generateMemoryInitiatorFunctions(compiledModules)).toMatchSnapshot();
	});
});
