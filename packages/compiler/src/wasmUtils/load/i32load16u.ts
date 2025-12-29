import { unsignedLEB128 } from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly i32.load16_u instruction to load an unsigned 16-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 1 (2-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.load16_u instruction
 */
export function i32load16u(alignment = 1, offset = 0): number[] {
	return [Instruction.I32_LOAD_16_U, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('i32load16u generates correct bytecode', () => {
		expect(i32load16u()).toStrictEqual([47, 1, 0]);
	});
}
