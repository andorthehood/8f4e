import unsignedLEB128 from '../encoding/unsignedLEB128';
import i32const from '../const/i32const';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly i32.store16 instruction to store the low 16 bits of a 32-bit integer to memory.
 *
 * @param address - Optional address to store at (generates i32.const if provided)
 * @param value - Optional value to store (generates i32.const if provided)
 * @param alignment - Log2 of the memory alignment in bytes (defaults to 1, meaning 2^1 = 2-byte alignment)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.store16 instruction and optional setup
 */
export default function i32store16(address?: number, value?: number, alignment = 1, offset = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.I32_STORE16,
		...unsignedLEB128(alignment),
		...unsignedLEB128(offset),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('i32store16 with no setup generates only store16 instruction', () => {
		const result = i32store16();
		expect(result).toStrictEqual([0x3b, 1, 0]); // opcode 0x3b, alignment 1, offset 0
	});

	test('i32store16 with offset generates correct encoding', () => {
		const result = i32store16(undefined, undefined, 1, 4);
		expect(result).toStrictEqual([0x3b, 1, 4]);
	});

	test('i32store16 with address and value generates full instruction sequence', () => {
		const result = i32store16(100, 1234);
		expect(result).toContain(0x3b);
	});
}
