import { ArgumentType, type AST } from '../types';
import { ErrorCode, getError } from '../errors';

/**
 * Extracts the constants block name from an AST.
 * @param ast - The AST to extract the constants name from
 * @returns The constants block name
 * @throws Error if constants instruction is missing or has invalid argument type
 */
export function getConstantsName(ast: AST): string {
	const constantsInstruction = ast.find(line => line.instruction === 'constants');

	if (!constantsInstruction) {
		throw new Error('Missing constants instruction');
	}

	const argument = constantsInstruction.arguments[0];

	if (!argument) {
		throw getError(ErrorCode.MISSING_ARGUMENT, constantsInstruction);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, constantsInstruction);
	}

	return argument.value;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getConstantsName', () => {
		it('should extract constants name from AST', () => {
			const ast: AST = [
				{
					instruction: 'constants',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'math' }],
					lineNumber: 1,
				},
			];

			expect(getConstantsName(ast)).toBe('math');
		});

		it('should throw when constants instruction is missing', () => {
			const ast: AST = [];
			expect(() => getConstantsName(ast)).toThrow('Missing constants instruction');
		});

		it('should throw when arguments are missing', () => {
			const ast: AST = [
				{
					instruction: 'constants',
					arguments: [],
					lineNumber: 1,
				},
			];

			expect(() => getConstantsName(ast)).toThrow('Missing argument');
		});

		it('should throw when argument type is not identifier', () => {
			const ast: AST = [
				{
					instruction: 'constants',
					arguments: [{ type: ArgumentType.LITERAL, value: 123, isInteger: true }],
					lineNumber: 1,
				},
			];

			expect(() => getConstantsName(ast)).toThrow('Expected identifier');
		});
	});
}
