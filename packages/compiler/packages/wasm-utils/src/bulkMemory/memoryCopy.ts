import prefixedInstruction from '../encoding/prefixedInstruction';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import { WASM_MISC } from '../wasmInstruction';
import { WASM_MISC_MEMORY_COPY } from '../wasmMiscInstruction';

/**
 * Creates a WebAssembly memory.copy instruction.
 *
 * Stack: destination memory offset, source memory offset, byte count.
 */
export default function memoryCopy(destinationMemoryIndex = 0, sourceMemoryIndex = 0): number[] {
	return [
		...prefixedInstruction(WASM_MISC, WASM_MISC_MEMORY_COPY),
		...unsignedLEB128(destinationMemoryIndex),
		...unsignedLEB128(sourceMemoryIndex),
	];
}
