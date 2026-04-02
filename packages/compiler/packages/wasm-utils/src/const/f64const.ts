import ieee754_64 from '../encoding/ieee754_64';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly f64.const instruction to push a 64-bit floating-point constant onto the stack.
 *
 * @param number - The floating-point value
 * @returns Byte array representing the f64.const instruction
 */
export default function f64const(number: number): number[] {
	return [Instruction.F64_CONST, ...ieee754_64(number)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('f64const generates correct bytecode for 0', () => {
		expect(f64const(0)).toStrictEqual([68, 0, 0, 0, 0, 0, 0, 0, 0]);
	});

	test('f64const generates correct bytecode for 1', () => {
		expect(f64const(1)).toStrictEqual([68, 0, 0, 0, 0, 0, 0, 240, 63]);
	});
}
