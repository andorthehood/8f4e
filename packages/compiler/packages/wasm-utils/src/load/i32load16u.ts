import { WASM_I32_LOAD_16_U } from '../wasmInstruction';
import memarg from '../memory/memarg';

/**
 * Creates a WebAssembly i32.load16_u instruction to load an unsigned 16-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 1 (2-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @param memoryIndex - Memory index to load from, defaults to 0
 * @returns Byte array representing the i32.load16_u instruction
 */
export default function i32load16u(alignment = 1, offset = 0, memoryIndex = 0): number[] {
	return [WASM_I32_LOAD_16_U, ...memarg(alignment, offset, memoryIndex)];
}
