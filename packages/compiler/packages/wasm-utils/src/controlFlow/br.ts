import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly br (branch) instruction for unconditional branching.
 *
 * @param breakDepth - The depth of the label to branch to (0 = current block)
 * @returns Byte array representing the br instruction
 */
export default function br(breakDepth: number): number[] {
	return [Instruction.BR, ...unsignedLEB128(breakDepth)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('br generates correct bytecode', () => {
		expect(br(0)).toStrictEqual([12, 0]);
		expect(br(2)).toStrictEqual([12, 2]);
	});
}
