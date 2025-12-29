import { ieee754 } from './ieee754';
import Instruction from './wasmInstruction';

/**
 * Creates a WebAssembly f32.const instruction to push a 32-bit floating-point constant onto the stack.
 *
 * @param number - The floating-point value
 * @returns Byte array representing the f32.const instruction
 */
export function f32const(number: number): number[] {
	return [Instruction.F32_CONST, ...ieee754(number)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('f32const generates correct bytecode for various floats', () => {
		expect(f32const(1)).toStrictEqual([67, 0, 0, 128, 63]);
		expect(f32const(32)).toStrictEqual([67, 0, 0, 0, 66]);
		expect(f32const(256)).toStrictEqual([67, 0, 0, 128, 67]);
		expect(f32const(-1)).toStrictEqual([67, 0, 0, 128, 191]);
		expect(f32const(-256)).toStrictEqual([67, 0, 0, 128, 195]);
		expect(f32const(3.14)).toStrictEqual([67, 195, 245, 72, 64]);
	});
}
