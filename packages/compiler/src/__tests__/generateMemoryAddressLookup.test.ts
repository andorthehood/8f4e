import modules from './__fixtures__/modules';

import { compileModules } from '..';
import { generateMemoryAddressLookup } from '../initializeMemory';

describe('compiler', () => {
	test('generateMemoryAddressLookup', () => {
		const compiledModules = compileModules(modules);
		expect(generateMemoryAddressLookup(compiledModules)).toMatchSnapshot();
	});
});
