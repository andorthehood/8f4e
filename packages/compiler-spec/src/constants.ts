import { BASE_TYPE_METADATA } from './memory';

export const LOGIC_HIGH = BASE_TYPE_METADATA.int16.max;
export const LOGIC_LOW = 0;
// Global allocation grid is 4 bytes so memory maps cleanly to Int32Array/Float32Array views.
// float64 declarations require an even word offset (2-word boundary) so their byteAddress is
// divisible by 8, enabling safe Float64Array / DataView access. Any required alignment gap
// (0 or 1 word) is absorbed into the float64 entry's allocationUnitCount.
export const ALLOCATION_UNIT_BYTE_SIZE = 4;
export const SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS = [1, 2, ALLOCATION_UNIT_BYTE_SIZE, ALLOCATION_UNIT_BYTE_SIZE * 2];
export const BYTE_MEMORY_ACCESS_WIDTH = SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS[0];
export const HALF_WORD_MEMORY_ACCESS_WIDTH = SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS[1];
export const WORD_MEMORY_ACCESS_WIDTH = ALLOCATION_UNIT_BYTE_SIZE;
export const DOUBLE_WORD_MEMORY_ACCESS_WIDTH = SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS[3];

export { WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-wasm-utils';
