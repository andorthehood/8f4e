import signedLEB128 from '../encoding/signedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly i32.const instruction to push a signed 32-bit integer constant onto the stack.
 *
 * @param number - The signed integer value
 * @returns Byte array representing the i32.const instruction
 */
export default function i32const(number: number): number[] {
	return [Instruction.I32_CONST, ...signedLEB128(number)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('i32const generates correct bytecode for positive values', () => {
		expect(i32const(1)).toStrictEqual([65, 1]);
		expect(i32const(32)).toStrictEqual([65, 32]);
		expect(i32const(256)).toStrictEqual([65, 128, 2]);
	});

	test('i32const generates correct bytecode for negative values', () => {
		expect(i32const(-1)).toStrictEqual([65, 127]);
		expect(i32const(-256)).toStrictEqual([65, 128, 126]);
	});
}
