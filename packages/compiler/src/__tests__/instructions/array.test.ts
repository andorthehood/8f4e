import { compile } from '../../compiler';

describe('array', () => {
	test('if it throws error when arguments are missing', () => {
		expect(() => compile('array')).toThrowError(/Missing/);
		expect(() => compile('array foo')).toThrowError(/Missing/);
		expect(() => compile('array foo 10')).toThrowError(/Missing/);
	});
});
