import Instruction from '../wasmInstruction';
import Type from '../type';

/**
 * Creates a WebAssembly if-else-end control flow structure.
 *
 * @param resultType - The result type of the if-else expression
 * @param trueBranch - Instructions to execute if condition is true
 * @param falseBranch - Instructions to execute if condition is false (defaults to empty)
 * @returns Byte array representing the if-else-end structure
 */
export function ifelse(resultType: Type, trueBranch: number[], falseBranch: number[] = []): number[] {
	return [Instruction.IF, resultType, ...trueBranch, Instruction.ELSE, ...falseBranch, Instruction.END];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('ifelse generates correct structure', () => {
		const result = ifelse(Type.I32, [65, 1], [65, 0]);
		expect(result).toStrictEqual([4, 127, 65, 1, 5, 65, 0, 11]);
	});
}
