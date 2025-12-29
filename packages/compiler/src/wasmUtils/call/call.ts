import { unsignedLEB128 } from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly call instruction to invoke a function by index.
 *
 * @param functionIndex - The index of the function to call
 * @returns Byte array representing the call instruction
 */
export function call(functionIndex: number): number[] {
	return [Instruction.CALL, ...unsignedLEB128(functionIndex)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('call generates correct bytecode', () => {
		expect(call(1)).toStrictEqual([16, 1]);
		expect(call(32)).toStrictEqual([16, 32]);
		expect(call(256)).toStrictEqual([16, 128, 2]);
	});
}
