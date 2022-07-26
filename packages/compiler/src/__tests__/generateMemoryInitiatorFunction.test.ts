import { generateMemoryInitiatorFunction, compileModules } from '..';
import modules from './__fixtures__/modules.json';

describe('compiler', () => {
	test('generateMemoryInitiatorFunction', () => {
		const compiledModules = compileModules(modules);
		expect(generateMemoryInitiatorFunction(compiledModules)).toMatchSnapshot();
	});
});
