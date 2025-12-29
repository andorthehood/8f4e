import { unsignedLEB128 } from './unsignedLEB128';
import { i32const } from './i32const';
import Instruction from './wasmInstruction';

/**
 * Creates a WebAssembly i32.store instruction to store a 32-bit integer to memory.
 *
 * @param address - Optional address to store at (generates i32.const if provided)
 * @param value - Optional value to store (generates i32.const if provided)
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.store instruction and optional setup
 */
export function i32store(address?: number, value?: number, alignment = 2, offset = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.I32_STORE,
		...unsignedLEB128(alignment),
		...unsignedLEB128(offset),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('i32store with no setup generates only store instruction', () => {
		const result = i32store();
		expect(result.slice(-3)).toStrictEqual([54, 2, 0]);
	});

	test('i32store with address and value generates full instruction sequence', () => {
		const result = i32store(100, 42);
		expect(result).toContain(54);
	});
}
