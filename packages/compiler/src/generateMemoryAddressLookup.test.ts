import modules from './__fixtures__/modules';
import { generateMemoryAddressLookup } from './initializeMemory';

import { compileModules } from '.';

describe('compiler', () => {
	test('generateMemoryAddressLookup', () => {
		const compiledModules = compileModules(modules);
		expect(generateMemoryAddressLookup(compiledModules)).toMatchSnapshot();
	});
});
