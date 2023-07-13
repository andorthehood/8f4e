import modules from './__fixtures__/modules';
import { compileToAST } from './compiler';

import { compileModules, generateMemoryInitiatorFunction } from '.';

describe('compiler', () => {
	test('generateMemoryInitiatorFunction', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		const compiledModules = compileModules(astModules, {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
		});
		expect(generateMemoryInitiatorFunction(compiledModules)).toMatchSnapshot();
	});
});
