import modules from './__fixtures__/modules.json';

import { compileModules, generateMemoryInitiatorFunction } from '..';

describe('compiler', () => {
	test('generateMemoryInitiatorFunction', () => {
		const compiledModules = compileModules(modules);
		expect(generateMemoryInitiatorFunction(compiledModules)).toMatchSnapshot();
	});
});
