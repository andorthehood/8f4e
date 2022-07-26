import { compileModules } from '..';
import { generateMemoryAddressLookup } from '../initializeMemory';
import modules from './__fixtures__/modules.json';

describe('compiler', () => {
	test('generateMemoryAddressLookup', () => {
		const compiledModules = compileModules(modules);
		expect(generateMemoryAddressLookup(compiledModules)).toMatchSnapshot();
	});
});
