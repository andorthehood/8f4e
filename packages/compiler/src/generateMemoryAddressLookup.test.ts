import modules from './__fixtures__/modules';
import { generateMemoryAddressLookup } from './initializeMemory';

import { compileModules } from '.';

describe('compiler', () => {
	test('generateMemoryAddressLookup', () => {
		const compiledModules = compileModules(modules, { startingMemoryWordAddress: 0, constants: {} });
		expect(generateMemoryAddressLookup(compiledModules)).toMatchSnapshot();
	});
});
