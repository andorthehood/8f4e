import modules from './__fixtures__/modules';

import { compileModules } from '.';

describe('compiler', () => {
	test('compileModules', () => {
		expect(
			compileModules(modules, {
				startingMemoryWordAddress: 0,
				environmentExtensions: { constants: {}, ignoredKeywords: [] },
			})
		).toMatchSnapshot();
	});
});
