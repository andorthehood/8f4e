import Instruction from '../wasmInstruction';

import type { WasmType } from '../type';

/**
 * Creates a WebAssembly if-else-end control flow structure.
 *
 * @param resultType - The result type of the if-else expression
 * @param trueBranch - Instructions to execute if condition is true
 * @param falseBranch - Instructions to execute if condition is false (defaults to empty)
 * @returns Byte array representing the if-else-end structure
 */
export default function ifelse(resultType: WasmType, trueBranch: number[], falseBranch: number[] = []): number[] {
	return [Instruction.IF, resultType, ...trueBranch, Instruction.ELSE, ...falseBranch, Instruction.END];
}
