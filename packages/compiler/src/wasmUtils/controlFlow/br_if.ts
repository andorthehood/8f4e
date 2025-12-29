import { unsignedLEB128 } from '../unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly br_if (conditional branch) instruction.
 *
 * @param breakDepth - The depth of the label to branch to (0 = current block)
 * @returns Byte array representing the br_if instruction
 */
export function br_if(breakDepth: number): number[] {
	return [Instruction.BR_IF, ...unsignedLEB128(breakDepth)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('br_if generates correct bytecode', () => {
		expect(br_if(0)).toStrictEqual([13, 0]);
		expect(br_if(1)).toStrictEqual([13, 1]);
	});
}
