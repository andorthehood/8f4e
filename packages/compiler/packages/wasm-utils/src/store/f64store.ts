import unsignedLEB128 from '../encoding/unsignedLEB128';
import i32const from '../const/i32const';
import f64const from '../const/f64const';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly f64.store instruction to store a 64-bit float to memory.
 *
 * @param address - Optional address to store at (generates i32.const if provided)
 * @param value - Optional value to store (generates f64.const if provided)
 * @param alignment - Memory alignment (power of 2), defaults to 3 (8-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the f64.store instruction and optional setup
 */
export default function f64store(address?: number, value?: number, alignment = 3, offset = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : f64const(value)),
		Instruction.F64_STORE,
		...unsignedLEB128(alignment),
		...unsignedLEB128(offset),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('f64store with no setup generates only store instruction', () => {
		const result = f64store();
		expect(result.slice(-3)).toStrictEqual([57, 3, 0]);
	});

	test('f64store with address and value generates full instruction sequence', () => {
		const result = f64store(0, 1.0);
		expect(result).toContain(57);
	});
}
