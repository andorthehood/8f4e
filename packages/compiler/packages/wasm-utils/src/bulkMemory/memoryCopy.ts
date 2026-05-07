import unsignedLEB128 from '../encoding/unsignedLEB128';
import prefixedInstruction from '../encoding/prefixedInstruction';
import WASMInstruction from '../wasmInstruction';
import WASMMiscInstruction from '../wasmMiscInstruction';

/**
 * Creates a WebAssembly memory.copy instruction.
 *
 * Stack: destination memory offset, source memory offset, byte count.
 */
export default function memoryCopy(destinationMemoryIndex = 0, sourceMemoryIndex = 0): number[] {
	return [
		...prefixedInstruction(WASMInstruction.MISC, WASMMiscInstruction.MEMORY_COPY),
		...unsignedLEB128(destinationMemoryIndex),
		...unsignedLEB128(sourceMemoryIndex),
	];
}
