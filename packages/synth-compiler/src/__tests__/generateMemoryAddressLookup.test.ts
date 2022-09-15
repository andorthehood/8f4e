import modules from './__fixtures__/modules.json';

import { compileModules } from '..';
import { generateMemoryAddressLookup } from '../initializeMemory';

describe('compiler', () => {
	test('generateMemoryAddressLookup', () => {
		const compiledModules = compileModules(modules);
		expect(generateMemoryAddressLookup(compiledModules)).toMatchSnapshot();
	});
});
