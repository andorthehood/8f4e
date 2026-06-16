import { BASE_TYPE_METADATA } from './memory';

export const LOGIC_HIGH = BASE_TYPE_METADATA.int16.max;
export const LOGIC_LOW = 0;
// Global allocation grid is 4 bytes so memory maps cleanly to Int32Array/Float32Array views.
// float64 declarations require an even word offset (2-word boundary) so their byteAddress is
// divisible by 8, enabling safe Float64Array / DataView access. Any required alignment gap
// (0 or 1 word) is absorbed into the float64 entry's wordAlignedSize.
export const GLOBAL_ALIGNMENT_BOUNDARY = BASE_TYPE_METADATA.int.wordSize;
export const BYTE_MEMORY_ACCESS_WIDTH = BASE_TYPE_METADATA.int8.wordSize;
export const HALF_WORD_MEMORY_ACCESS_WIDTH = BASE_TYPE_METADATA.int16.wordSize;
export const WORD_MEMORY_ACCESS_WIDTH = GLOBAL_ALIGNMENT_BOUNDARY;
export const DOUBLE_WORD_MEMORY_ACCESS_WIDTH = BASE_TYPE_METADATA.float64.wordSize;
export const SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS = Array.from(
	new Set(
		Object.values(BASE_TYPE_METADATA)
			.map(({ wordSize }) => wordSize)
			.sort((left, right) => left - right)
	)
);

export { WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-wasm-utils';
