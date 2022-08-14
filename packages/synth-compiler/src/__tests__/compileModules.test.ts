import { compileModules } from '..';
import modules from './__fixtures__/modules.json';

describe('compiler', () => {
	test('compileModules', () => {
		expect(compileModules(modules)).toMatchSnapshot();
	});
});
