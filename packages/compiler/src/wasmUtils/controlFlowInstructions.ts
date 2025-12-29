import { unsignedLEB128 } from './unsignedLEB128';
import Instruction from './wasmInstruction';
import Type from './type';

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

/**
 * Creates a WebAssembly br (branch) instruction for unconditional branching.
 *
 * @param breakDepth - The depth of the label to branch to (0 = current block)
 * @returns Byte array representing the br instruction
 */
export function br(breakDepth: number): number[] {
	return [Instruction.BR, ...unsignedLEB128(breakDepth)];
}

/**
 * Creates a WebAssembly br_if (conditional branch) instruction.
 *
 * @param breakDepth - The depth of the label to branch to (0 = current block)
 * @returns Byte array representing the br_if instruction
 */
export function br_if(breakDepth: number): number[] {
	return [Instruction.BR_IF, ...unsignedLEB128(breakDepth)];
}

/**
 * Creates a WebAssembly loop structure with automatic back-edge branching.
 *
 * @param resultType - The result type of the loop
 * @param code - Instructions to execute in the loop body
 * @returns Byte array representing the loop-end structure with a branch back to start
 */
export function loop(resultType: Type, code: number[]): number[] {
	return [Instruction.LOOP, resultType, ...code, ...br(0), Instruction.END];
}

/**
 * Creates a WebAssembly block structure.
 *
 * @param resultType - The result type of the block
 * @param code - Instructions to execute in the block
 * @returns Byte array representing the block-end structure
 */
export function block(resultType: Type, code: number[]): number[] {
	return [Instruction.BLOCK, resultType, ...code, Instruction.END];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('ifelse generates correct structure', () => {
		const result = ifelse(Type.I32, [65, 1], [65, 0]);
		expect(result).toStrictEqual([4, 127, 65, 1, 5, 65, 0, 11]);
	});

	test('br generates correct bytecode', () => {
		expect(br(0)).toStrictEqual([12, 0]);
		expect(br(2)).toStrictEqual([12, 2]);
	});

	test('br_if generates correct bytecode', () => {
		expect(br_if(0)).toStrictEqual([13, 0]);
		expect(br_if(1)).toStrictEqual([13, 1]);
	});

	test('loop generates structure with branch back', () => {
		const result = loop(Type.VOID, [65, 1]);
		expect(result).toContain(3);
		expect(result).toContain(12);
		expect(result).toContain(11);
	});

	test('block generates correct structure', () => {
		const result = block(Type.I32, [65, 42]);
		expect(result).toStrictEqual([2, 127, 65, 42, 11]);
	});
}
