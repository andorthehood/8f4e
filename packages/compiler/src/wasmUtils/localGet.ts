import { unsignedLEB128 } from './unsignedLEB128';
import Instruction from './wasmInstruction';

/**
 * Creates a WebAssembly local.get instruction to retrieve a local variable onto the stack.
 *
 * @param index - The index of the local variable
 * @returns Byte array representing the local.get instruction
 */
export function localGet(index: number): number[] {
	return [Instruction.LOCAL_GET, ...unsignedLEB128(index)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('localGet generates correct bytecode', () => {
		expect(localGet(1)).toStrictEqual([32, 1]);
		expect(localGet(32)).toStrictEqual([32, 32]);
		expect(localGet(256)).toStrictEqual([32, 128, 2]);
	});
}
