import { describe, it, expect } from 'vitest';

import { parseArgument, ArgumentType } from '../src/parseArgument';

describe('parseArgument', () => {
	describe('decimal literals', () => {
		it('parses positive integers', () => {
			const result = parseArgument('42');
			expect(result).toEqual({
				value: 42,
				type: ArgumentType.LITERAL,
				isInteger: true,
			});
		});

		it('parses negative integers', () => {
			const result = parseArgument('-42');
			expect(result).toEqual({
				value: -42,
				type: ArgumentType.LITERAL,
				isInteger: true,
			});
		});

		it('parses positive floats', () => {
			const result = parseArgument('3.14');
			expect(result).toEqual({
				value: 3.14,
				type: ArgumentType.LITERAL,
				isInteger: false,
			});
		});

		it('parses negative floats', () => {
			const result = parseArgument('-3.14');
			expect(result).toEqual({
				value: -3.14,
				type: ArgumentType.LITERAL,
				isInteger: false,
			});
		});
	});

	describe('hexadecimal literals', () => {
		it('parses positive hex numbers', () => {
			const result = parseArgument('0xFF');
			expect(result).toEqual({
				value: 255,
				type: ArgumentType.LITERAL,
				isInteger: true,
			});
		});

		it('parses negative hex numbers', () => {
			const result = parseArgument('-0x10');
			expect(result).toEqual({
				value: -16,
				type: ArgumentType.LITERAL,
				isInteger: true,
			});
		});

		it('handles lowercase hex digits', () => {
			const result = parseArgument('0xabcd');
			expect(result).toEqual({
				value: 43981,
				type: ArgumentType.LITERAL,
				isInteger: true,
			});
		});
	});

	describe('binary literals', () => {
		it('parses positive binary numbers', () => {
			const result = parseArgument('0b1010');
			expect(result).toEqual({
				value: 10,
				type: ArgumentType.LITERAL,
				isInteger: true,
			});
		});

		it('parses negative binary numbers', () => {
			const result = parseArgument('-0b1111');
			expect(result).toEqual({
				value: -15,
				type: ArgumentType.LITERAL,
				isInteger: true,
			});
		});
	});

	describe('identifiers', () => {
		it('parses simple identifiers', () => {
			const result = parseArgument('myVariable');
			expect(result).toEqual({
				value: 'myVariable',
				type: ArgumentType.IDENTIFIER,
			});
		});

		it('parses identifiers with special characters', () => {
			const result = parseArgument('my_variable$123');
			expect(result).toEqual({
				value: 'my_variable$123',
				type: ArgumentType.IDENTIFIER,
			});
		});

		it('parses identifiers starting with special prefixes', () => {
			const result = parseArgument('&memory');
			expect(result).toEqual({
				value: '&memory',
				type: ArgumentType.IDENTIFIER,
			});
		});
	});
});
