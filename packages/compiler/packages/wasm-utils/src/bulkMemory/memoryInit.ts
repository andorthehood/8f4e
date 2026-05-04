import unsignedLEB128 from '../encoding/unsignedLEB128';
import prefixedInstruction from '../encoding/prefixedInstruction';
import WASMInstruction from '../wasmInstruction';
import WASMMiscInstruction from '../wasmMiscInstruction';

/**
 * Creates a WebAssembly memory.init instruction.
 *
 * Stack: destination memory offset, source data offset, byte count.
 */
export default function memoryInit(dataSegmentIndex = 0, memoryIndex = 0): number[] {
	return [
		...prefixedInstruction(WASMInstruction.MISC, WASMMiscInstruction.MEMORY_INIT),
		...unsignedLEB128(dataSegmentIndex),
		...unsignedLEB128(memoryIndex),
	];
}
