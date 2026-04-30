import type { DataStructure } from '@8f4e/compiler-types';
import type { MemoryViews } from '../../../types';

// Hot render path: cache byte-to-hex conversion once so per-frame formatting avoids repeated allocations.
const HEX_BYTE_LOOKUP = Array.from({ length: 256 }, (_, value) => value.toString(16).padStart(2, '0'));

function formatHexBytes(memoryViews: MemoryViews, memory: DataStructure, bufferPointer: number): string {
	const byteStart = memory.byteAddress + bufferPointer * memory.elementWordSize;
	const byteEnd = byteStart + memory.elementWordSize;
	let result = '';

	// Iterate the backing bytes directly instead of building temporary arrays in the render loop.
	for (let index = byteEnd - 1; index >= byteStart; index--) {
		if (result) {
			result += ' ';
		}

		result += HEX_BYTE_LOOKUP[memoryViews.uint8[index]];
	}

	return result;
}

export default function formatDebuggerValue(
	memoryViews: MemoryViews,
	memory: DataStructure,
	bufferPointer: number,
	displayFormat: 'decimal' | 'binary' | 'hex'
): string {
	if (displayFormat === 'hex') {
		return formatHexBytes(memoryViews, memory, bufferPointer);
	}

	const radixMap = { decimal: 10, binary: 2 } as const;
	const radix = radixMap[displayFormat];

	if (memory.elementWordSize === 1 && memory.isInteger) {
		const view = memory.isUnsigned ? memoryViews.uint8 : memoryViews.int8;
		return view[memory.byteAddress + bufferPointer].toString(radix);
	}

	if (memory.elementWordSize === 2 && memory.isInteger) {
		const view = memory.isUnsigned ? memoryViews.uint16 : memoryViews.int16;
		return view[memory.byteAddress / 2 + bufferPointer].toString(radix);
	}

	if (memory.elementWordSize === 8 && !memory.isInteger) {
		return memoryViews.float64[memory.byteAddress / 8 + bufferPointer].toFixed(4);
	}

	return memory.isInteger
		? memoryViews.int32[memory.wordAlignedAddress + bufferPointer].toString(radix)
		: memoryViews.float32[memory.wordAlignedAddress + bufferPointer].toFixed(4);
}
