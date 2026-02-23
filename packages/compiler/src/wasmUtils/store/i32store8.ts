import unsignedLEB128 from '../encoding/unsignedLEB128';
import i32const from '../const/i32const';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly i32.store8 instruction to store the low byte of a 32-bit integer to memory.
 *
 * @param address - Optional address to store at (generates i32.const if provided)
 * @param value - Optional value to store (generates i32.const if provided)
 * @param alignment - Memory alignment (power of 2), defaults to 0 (byte-aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.store8 instruction and optional setup
 */
export default function i32store8(address?: number, value?: number, alignment = 0, offset = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.I32_STORE8,
		...unsignedLEB128(alignment),
		...unsignedLEB128(offset),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('i32store8 with no setup generates only store8 instruction', () => {
		const result = i32store8();
		expect(result).toStrictEqual([0x3a, 0, 0]); // opcode 0x3a, alignment 0, offset 0
	});

	test('i32store8 with offset generates correct encoding', () => {
		const result = i32store8(undefined, undefined, 0, 5);
		expect(result).toStrictEqual([0x3a, 0, 5]);
	});

	test('i32store8 with address and value generates full instruction sequence', () => {
		const result = i32store8(100, 72);
		expect(result).toContain(0x3a);
	});
}
