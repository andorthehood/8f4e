import { WASM_I32_LOAD } from '../wasmInstruction';
import memarg from '../memory/memarg';

/**
 * Creates a WebAssembly i32.load instruction to load a 32-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 2 (4-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @param memoryIndex - Memory index to load from, defaults to 0
 * @returns Byte array representing the i32.load instruction
 */
export default function i32load(alignment = 2, offset = 0, memoryIndex = 0): number[] {
	return [WASM_I32_LOAD, ...memarg(alignment, offset, memoryIndex)];
}
