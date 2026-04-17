import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly i32.load instruction to load a 32-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the i32.load instruction
 */
export default function i32load(alignment = 2, offset = 0): number[] {
	return [Instruction.I32_LOAD, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}
