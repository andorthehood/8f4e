import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly i32.load8_u instruction to load an unsigned 8-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 0 (1-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.load8_u instruction
 */
export default function i32load8u(alignment = 0, offset = 0): number[] {
	return [Instruction.I32_LOAD_8_U, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('i32load8u generates correct bytecode', () => {
		expect(i32load8u()).toStrictEqual([45, 0, 0]);
	});
}
