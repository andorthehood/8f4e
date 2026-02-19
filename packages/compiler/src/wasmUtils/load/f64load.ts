import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly f64.load instruction to load a 64-bit float from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 3 (8-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the f64.load instruction
 */
export default function f64load(alignment = 3, offset = 0): number[] {
	return [Instruction.F64_LOAD, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('f64load generates correct bytecode', () => {
		expect(f64load()).toStrictEqual([43, 3, 0]);
		expect(f64load(0, 8)).toStrictEqual([43, 0, 8]);
	});
}
