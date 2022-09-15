import modules from './__fixtures__/modules.json';

import { compileModules } from '..';

describe('compiler', () => {
	test('compileModules', () => {
		expect(compileModules(modules)).toMatchSnapshot();
	});
});
