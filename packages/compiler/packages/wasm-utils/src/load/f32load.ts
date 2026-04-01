import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly f32.load instruction to load a 32-bit float from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the f32.load instruction
 */
export default function f32load(alignment = 2, offset = 0): number[] {
	return [Instruction.F32_LOAD, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('f32load generates correct bytecode', () => {
		expect(f32load()).toStrictEqual([42, 2, 0]);
		expect(f32load(0, 16)).toStrictEqual([42, 0, 16]);
	});
}
