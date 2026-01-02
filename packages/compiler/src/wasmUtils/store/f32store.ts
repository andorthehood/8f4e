import unsignedLEB128 from '../encoding/unsignedLEB128';
import i32const from '../const/i32const';
import f32const from '../const/f32const';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly f32.store instruction to store a 32-bit float to memory.
 *
 * @param address - Optional address to store at (generates i32.const if provided)
 * @param value - Optional value to store (generates f32.const if provided)
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the f32.store instruction and optional setup
 */
export default function f32store(address?: number, value?: number, alignment = 2, offset = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : f32const(value)),
		Instruction.F32_STORE,
		...unsignedLEB128(alignment),
		...unsignedLEB128(offset),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('f32store with no setup generates only store instruction', () => {
		const result = f32store();
		expect(result.slice(-3)).toStrictEqual([56, 2, 0]);
	});

	test('f32store with address and value generates full instruction sequence', () => {
		const result = f32store(100, 3.14);
		expect(result).toContain(56);
	});
}
