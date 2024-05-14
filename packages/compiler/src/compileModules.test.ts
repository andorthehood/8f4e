import { compileToAST } from './compiler';
import modules from './__fixtures__/modules';

import { compileModules } from '.';

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
