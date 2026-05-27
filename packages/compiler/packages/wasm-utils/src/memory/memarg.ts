import unsignedLEB128 from '../encoding/unsignedLEB128';

/**
 * Flag bit that marks a memory instruction memarg as carrying an explicit memory index.
 */
const MULTI_MEMORY_MEMARG_FLAG = 0x40;

/**
 * Encodes a WebAssembly memory argument with alignment, offset, and optional memory index fields.
 */
export default function memarg(alignment: number, offset: number, memoryIndex = 0): number[] {
	if (memoryIndex === 0) {
		return [...unsignedLEB128(alignment), ...unsignedLEB128(offset)];
	}

	return [
		...unsignedLEB128(alignment | MULTI_MEMORY_MEMARG_FLAG),
		...unsignedLEB128(memoryIndex),
		...unsignedLEB128(offset),
	];
}
