import { unsignedLEB128 } from './unsignedLEB128';
import Instruction from './wasmInstruction';

/**
 * Creates a WebAssembly i32.load instruction to load a 32-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.load instruction
 */
export function i32load(alignment = 2, offset = 0): number[] {
	return [Instruction.I32_LOAD, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

/**
 * Creates a WebAssembly i32.load8_s instruction to load a signed 8-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 0 (1-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.load8_s instruction
 */
export function i32load8s(alignment = 0, offset = 0): number[] {
	return [Instruction.I32_LOAD_8_S, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

/**
 * Creates a WebAssembly i32.load8_u instruction to load an unsigned 8-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 0 (1-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.load8_u instruction
 */
export function i32load8u(alignment = 0, offset = 0): number[] {
	return [Instruction.I32_LOAD_8_U, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

/**
 * Creates a WebAssembly i32.load16_s instruction to load a signed 16-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 1 (2-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.load16_s instruction
 */
export function i32load16s(alignment = 1, offset = 0): number[] {
	return [Instruction.I32_LOAD_16_S, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

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

/**
 * Creates a WebAssembly f32.load instruction to load a 32-bit float from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the f32.load instruction
 */
export function f32load(alignment = 2, offset = 0): number[] {
	return [Instruction.F32_LOAD, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('load instructions generate correct bytecode', () => {
		expect(i32load()).toStrictEqual([40, 2, 0]);
		expect(i32load8s()).toStrictEqual([44, 0, 0]);
		expect(i32load8u()).toStrictEqual([45, 0, 0]);
		expect(i32load16s()).toStrictEqual([46, 1, 0]);
		expect(i32load16u()).toStrictEqual([47, 1, 0]);
		expect(f32load()).toStrictEqual([42, 2, 0]);
	});

	test('load instructions accept custom alignment and offset', () => {
		expect(i32load(3, 8)).toStrictEqual([40, 3, 8]);
		expect(f32load(0, 16)).toStrictEqual([42, 0, 16]);
	});
}
