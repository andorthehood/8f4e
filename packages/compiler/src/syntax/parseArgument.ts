export enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
}

export type ArgumentLiteral = { type: ArgumentType.LITERAL; value: number; isInteger: boolean };
export type ArgumentIdentifier = { type: ArgumentType.IDENTIFIER; value: string };

export type Argument = ArgumentLiteral | ArgumentIdentifier;

/**
 * Parses a single argument from an instruction line.
 * Recognizes numeric literals (decimal, hex, binary) and identifiers.
 * @param argument - The argument string to parse.
 * @returns Parsed argument with type information.
 */
export function parseArgument(argument: string): Argument {
	switch (true) {
		case /^-?[0-9.]+$/.test(argument):
			return { value: parseFloat(argument), type: ArgumentType.LITERAL, isInteger: /^-?[0-9]+$/.test(argument) };
		case /^-?0x[0-9a-fA-F]+$/.test(argument):
			return { value: parseInt(argument.replace('0x', ''), 16), type: ArgumentType.LITERAL, isInteger: true };
		case /^-?0b[0-1]+$/.test(argument):
			return { value: parseInt(argument.replace('0b', ''), 2), type: ArgumentType.LITERAL, isInteger: true };
		default:
			return { value: argument, type: ArgumentType.IDENTIFIER };
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseArgument', () => {
		it('parses decimal integers', () => {
			expect(parseArgument('42')).toEqual({ value: 42, type: ArgumentType.LITERAL, isInteger: true });
			expect(parseArgument('-7')).toEqual({ value: -7, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('parses decimal floats', () => {
			expect(parseArgument('3.14')).toEqual({ value: 3.14, type: ArgumentType.LITERAL, isInteger: false });
		});

		it('parses hex integers', () => {
			expect(parseArgument('0x10')).toEqual({ value: 16, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('parses binary integers', () => {
			expect(parseArgument('0b101')).toEqual({ value: 5, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('parses identifiers', () => {
			expect(parseArgument('value')).toEqual({ value: 'value', type: ArgumentType.IDENTIFIER });
		});
	});
}
