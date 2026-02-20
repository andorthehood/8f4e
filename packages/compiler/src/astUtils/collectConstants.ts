import { ArgumentType, type AST, type ArgumentLiteral, type Namespace } from '../types';

/**
 * Collects all constant declarations from an AST.
 * @param ast - The AST to collect constants from
 * @returns Object mapping constant names to their values
 */
export default function collectConstants(ast: AST): Namespace['consts'] {
	return Object.fromEntries(
		ast
			.filter(({ instruction }) => instruction === 'const')
			.map(({ arguments: _arguments }) => {
				const lit = _arguments[1] as ArgumentLiteral;
				return [
					_arguments[0].value,
					{
						value: parseFloat(lit.value.toString()),
						isInteger: lit.isInteger,
						...(lit.isFloat64 ? { isFloat64: true } : {}),
					},
				];
			})
	);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('collectConstants', () => {
		it('should collect integer constants from AST', () => {
			const ast: AST = [
				{
					instruction: 'const',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'MAX_VALUE' },
						{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
					],
					lineNumber: 1,
				},
			];

			const result = collectConstants(ast);
			expect(result).toEqual({
				MAX_VALUE: { value: 100, isInteger: true },
			});
		});

		it('should collect float constants from AST', () => {
			const ast: AST = [
				{
					instruction: 'const',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'PI' },
						{ type: ArgumentType.LITERAL, value: 3.14159, isInteger: false },
					],
					lineNumber: 1,
				},
			];

			const result = collectConstants(ast);
			expect(result).toEqual({
				PI: { value: 3.14159, isInteger: false },
			});
		});

		it('should collect float64 constants from AST preserving isFloat64 flag', () => {
			const ast: AST = [
				{
					instruction: 'const',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'PI64' },
						{ type: ArgumentType.LITERAL, value: 3.141592653589793, isInteger: false, isFloat64: true },
					],
					lineNumber: 1,
				},
			];

			const result = collectConstants(ast);
			expect(result).toEqual({
				PI64: { value: 3.141592653589793, isInteger: false, isFloat64: true },
			});
		});

		it('should collect multiple constants from AST', () => {
			const ast: AST = [
				{
					instruction: 'const',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'PI' },
						{ type: ArgumentType.LITERAL, value: 3.14159, isInteger: false },
					],
					lineNumber: 1,
				},
				{
					instruction: 'const',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'TAU' },
						{ type: ArgumentType.LITERAL, value: 6.28318, isInteger: false },
					],
					lineNumber: 2,
				},
			];

			const result = collectConstants(ast);
			expect(result).toEqual({
				PI: { value: 3.14159, isInteger: false },
				TAU: { value: 6.28318, isInteger: false },
			});
		});

		it('should ignore non-const instructions', () => {
			const ast: AST = [
				{
					instruction: 'module',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'test' }],
					lineNumber: 1,
				},
				{
					instruction: 'const',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'VALUE' },
						{ type: ArgumentType.LITERAL, value: 42, isInteger: true },
					],
					lineNumber: 2,
				},
			];

			const result = collectConstants(ast);
			expect(result).toEqual({
				VALUE: { value: 42, isInteger: true },
			});
		});

		it('should return empty object when no constants exist', () => {
			const ast: AST = [
				{
					instruction: 'module',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'test' }],
					lineNumber: 1,
				},
			];

			const result = collectConstants(ast);
			expect(result).toEqual({});
		});
	});
}
