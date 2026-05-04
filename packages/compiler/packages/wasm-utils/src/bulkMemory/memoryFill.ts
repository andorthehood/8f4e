import unsignedLEB128 from '../encoding/unsignedLEB128';
import prefixedInstruction from '../encoding/prefixedInstruction';
import WASMInstruction from '../wasmInstruction';
import WASMMiscInstruction from '../wasmMiscInstruction';

/**
 * Creates a WebAssembly memory.fill instruction.
 *
 * Stack: destination memory offset, fill byte value, byte count.
 */
export default function memoryFill(memoryIndex = 0): number[] {
	return [
		...prefixedInstruction(WASMInstruction.MISC, WASMMiscInstruction.MEMORY_FILL),
		...unsignedLEB128(memoryIndex),
	];
}
