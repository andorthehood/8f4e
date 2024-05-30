import modules from './__fixtures__/modules';

import { compileToAST } from '../src/compiler';
import { compileModules } from '../src';

describe('compiler', () => {
	test('compileModules', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		expect(
			compileModules(astModules, {
				startingMemoryWordAddress: 0,
				environmentExtensions: { constants: {}, ignoredKeywords: [] },
				maxMemorySize: 1,
				initialMemorySize: 1,
			})
		).toMatchSnapshot();
	});
});
