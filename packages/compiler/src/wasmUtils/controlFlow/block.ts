import Instruction from '../wasmInstruction';
import Type from '../type';

/**
 * Creates a WebAssembly block structure.
 *
 * @param resultType - The result type of the block
 * @param code - Instructions to execute in the block
 * @returns Byte array representing the block-end structure
 */
export default function block(resultType: Type, code: number[]): number[] {
	return [Instruction.BLOCK, resultType, ...code, Instruction.END];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('block generates correct structure', () => {
		const result = block(Type.I32, [65, 42]);
		expect(result).toStrictEqual([2, 127, 65, 42, 11]);
	});
}
