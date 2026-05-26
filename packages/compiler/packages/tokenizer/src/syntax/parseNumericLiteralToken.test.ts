import { describe, expect, it } from 'vitest';

import parseNumericLiteralToken from './parseNumericLiteralToken';

describe('parseNumericLiteralToken', () => {
	it('parses decimal integers and floats', () => {
		expect(parseNumericLiteralToken('42')).toEqual({
			value: 42,
			isInteger: true,
		});
		expect(parseNumericLiteralToken('3.14')).toEqual({
			value: 3.14,
			isInteger: false,
		});
	});

	it('parses scientific notation as float-typed syntax', () => {
		expect(parseNumericLiteralToken('1e3')).toEqual({
			value: 1000,
			isInteger: false,
		});
		expect(parseNumericLiteralToken('1e-3')).toEqual({
			value: 0.001,
			isInteger: false,
		});
	});

	it('parses hex and binary integers', () => {
		expect(parseNumericLiteralToken('0x10')).toEqual({
			value: 16,
			isInteger: true,
			isHex: true,
		});
		expect(parseNumericLiteralToken('0b101')).toEqual({
			value: 5,
			isInteger: true,
		});
	});

	it('parses f64-suffixed literals', () => {
		expect(parseNumericLiteralToken('3f64')).toEqual({
			value: 3,
			isInteger: false,
			isFloat64: true,
		});
		expect(parseNumericLiteralToken('1.5e10f64')).toEqual({
			value: 1.5e10,
			isInteger: false,
			isFloat64: true,
		});
	});

	it('rejects non-finite numeric literals', () => {
		expect(() => parseNumericLiteralToken('1e309')).toThrow('Invalid numeric literal');
		expect(() => parseNumericLiteralToken('1e309f64')).toThrow('Invalid numeric literal');
	});

	it('returns null for non-literals', () => {
		expect(parseNumericLiteralToken('SIZE')).toBeNull();
		expect(parseNumericLiteralToken('2*3')).toBeNull();
	});
});
