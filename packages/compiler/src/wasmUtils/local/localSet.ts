import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly local.set instruction to store the top stack value into a local variable.
 *
 * @param index - The index of the local variable
 * @returns Byte array representing the local.set instruction
 */
export default function localSet(index: number): number[] {
	return [Instruction.LOCAL_SET, ...unsignedLEB128(index)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('localSet generates correct bytecode', () => {
		expect(localSet(1)).toStrictEqual([33, 1]);
		expect(localSet(32)).toStrictEqual([33, 32]);
		expect(localSet(256)).toStrictEqual([33, 128, 2]);
	});
}
