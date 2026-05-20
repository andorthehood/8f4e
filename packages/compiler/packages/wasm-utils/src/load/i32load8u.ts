import { WASM_I32_LOAD_8_U } from '../wasmInstruction';
import memarg from '../memory/memarg';

/**
 * Creates a WebAssembly i32.load8_u instruction to load an unsigned 8-bit integer from memory.
 *
 * @param alignment - Memory alignment (power of 2), defaults to 0 (1-byte aligned)
 * @param offset - Static offset from the address, defaults to 0
 * @param memoryIndex - Memory index to load from, defaults to 0
 * @returns Byte array representing the i32.load8_u instruction
 */
export default function i32load8u(alignment = 0, offset = 0, memoryIndex = 0): number[] {
	return [WASM_I32_LOAD_8_U, ...memarg(alignment, offset, memoryIndex)];
}
