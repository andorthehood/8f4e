import { WASM_F32_LOAD } from '../wasmInstruction';
import unsignedLEB128 from '../encoding/unsignedLEB128';

/**
 * Creates a WebAssembly f32.load instruction to load a 32-bit float from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @returns Byte array representing the f32.load instruction
 */
export default function f32load(alignment = 2, offset = 0): number[] {
	return [WASM_F32_LOAD, ...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
}
