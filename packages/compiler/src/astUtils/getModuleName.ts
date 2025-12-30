import { ArgumentType, type AST } from '../types';

/**
 * Extracts the module name from an AST.
 * @param ast - The AST to extract the module name from
 * @returns The module name
 * @throws Error if module instruction is missing or has invalid argument type
 */
export function getModuleName(ast: AST): string {
	const moduleInstruction = ast.find(line => line.instruction === 'module');

	if (!moduleInstruction) {
		throw 'Missing module instruction';
	}

	const argument = moduleInstruction.arguments[0];

	if (argument.type !== ArgumentType.IDENTIFIER) {
		throw 'Module instruction argument type invalid';
	}

	return argument.value;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getModuleName', () => {
		it('should extract module name from AST', () => {
			const ast: AST = [
				{
					instruction: 'module',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'testModule' }],
					lineNumber: 1,
				},
			];

			expect(getModuleName(ast)).toBe('testModule');
		});

		it('should throw when module instruction is missing', () => {
			const ast: AST = [];
			expect(() => getModuleName(ast)).toThrow('Missing module instruction');
		});

		it('should throw when argument type is not identifier', () => {
			const ast: AST = [
				{
					instruction: 'module',
					arguments: [{ type: ArgumentType.LITERAL, value: 123, isInteger: true }],
					lineNumber: 1,
				},
			];

			expect(() => getModuleName(ast)).toThrow('Module instruction argument type invalid');
		});
	});
}
