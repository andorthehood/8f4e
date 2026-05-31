import prefixedInstruction from '../encoding/prefixedInstruction';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import { WASM_MISC } from '../wasmInstruction';
import { WASM_MISC_MEMORY_FILL } from '../wasmMiscInstruction';

/**
 * Creates a WebAssembly memory.fill instruction.
 *
 * Stack: destination memory offset, fill byte value, byte count.
 */
export default function memoryFill(memoryIndex = 0): number[] {
	return [...prefixedInstruction(WASM_MISC, WASM_MISC_MEMORY_FILL), ...unsignedLEB128(memoryIndex)];
}
