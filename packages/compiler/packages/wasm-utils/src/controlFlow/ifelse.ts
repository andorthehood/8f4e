import { WASM_ELSE, WASM_END, WASM_IF } from '../wasmInstruction';

import type { WasmTypeValue } from '../type';

/**
 * Creates a WebAssembly if-else-end control flow structure.
 *
 * @param resultType - The result type of the if-else expression
 * @param trueBranch - Instructions to execute if condition is true
 * @param falseBranch - Instructions to execute if condition is false (defaults to empty)
 * @returns Byte array representing the if-else-end structure
 */
export default function ifelse(resultType: WasmTypeValue, trueBranch: number[], falseBranch: number[] = []): number[] {
	return [WASM_IF, resultType, ...trueBranch, WASM_ELSE, ...falseBranch, WASM_END];
}
