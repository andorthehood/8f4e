import type { PlannedMemoryDeclaration } from '@8f4e/compiler-spec';
import type { MemoryViews } from '../../../types';

export interface DebuggerValueFormat {
	elementWordSize: number;
	isInteger: boolean;
	isUnsigned: boolean;
}

// Hot render path: cache byte-to-hex conversion once so per-frame formatting avoids repeated allocations.
const HEX_BYTE_LOOKUP = Array.from({ length: 256 }, (_, value) => value.toString(16).padStart(2, '0'));

function formatHexBytes(memoryViews: MemoryViews, byteAddress: number, elementWordSize: number): string {
	const byteEnd = byteAddress + elementWordSize;
	let result = '';

	// Iterate the backing bytes directly instead of building temporary arrays in the render loop.
	for (let index = byteEnd - 1; index >= byteAddress; index--) {
		if (result) {
			result += ' ';
		}

		result += HEX_BYTE_LOOKUP[memoryViews.uint8[index]];
	}

	return result;
}

export function formatDebuggerValueAtAddress(
	memoryViews: MemoryViews,
	byteAddress: number,
	wordAlignedAddress: number,
	format: DebuggerValueFormat,
	displayFormat: 'decimal' | 'binary' | 'hex'
): string {
	if (displayFormat === 'hex') {
		return formatHexBytes(memoryViews, byteAddress, format.elementWordSize);
	}

	const radixMap = { decimal: 10, binary: 2 } as const;
	const radix = radixMap[displayFormat];

	if (format.elementWordSize === 1 && format.isInteger) {
		const view = format.isUnsigned ? memoryViews.uint8 : memoryViews.int8;
		return view[byteAddress].toString(radix);
	}

	if (format.elementWordSize === 2 && format.isInteger) {
		const view = format.isUnsigned ? memoryViews.uint16 : memoryViews.int16;
		return view[byteAddress / 2].toString(radix);
	}

	if (format.elementWordSize === 8 && !format.isInteger) {
		return memoryViews.float64[byteAddress / 8].toFixed(4);
	}

	return format.isInteger
		? memoryViews.int32[wordAlignedAddress].toString(radix)
		: memoryViews.float32[wordAlignedAddress].toFixed(4);
}

export default function formatDebuggerValue(
	memoryViews: MemoryViews,
	memory: PlannedMemoryDeclaration,
	bufferPointer: number,
	displayFormat: 'decimal' | 'binary' | 'hex'
): string {
	return formatDebuggerValueAtAddress(
		memoryViews,
		memory.byteAddress + bufferPointer * memory.elementWordSize,
		memory.wordAlignedAddress + bufferPointer,
		memory,
		displayFormat
	);
}
