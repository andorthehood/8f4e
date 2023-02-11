import { compile } from '../compiler';

describe('array', () => {
	test('if it throws error when arguments are missing', () => {
		expect(() => compile(['module test', 'array'])).toThrowError(/Missing/);
		expect(() => compile(['module test', 'array foo'])).toThrowError(/Missing/);
		expect(() => compile(['module test', 'array foo 10'])).toThrowError(/Missing/);
	});
});
