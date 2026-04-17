import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly call instruction to invoke a function by index.
 *
 * @param functionIndex - The index of the function to call
 * @returns Byte array representing the call instruction
 */
export default function call(functionIndex: number): number[] {
	return [Instruction.CALL, ...unsignedLEB128(functionIndex)];
}
