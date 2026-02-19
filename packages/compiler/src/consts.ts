export const I32_SIGNED_SMALLEST_NUMBER = -2147483648;
export const I32_SIGNED_LARGEST_NUMBER = 2147483647;
export const I16_SIGNED_LARGEST_NUMBER = 32767;
export const I16_SIGNED_SMALLEST_NUMBER = -32768;
export const LOGIC_HIGH = I16_SIGNED_LARGEST_NUMBER;
export const LOGIC_LOW = 0;
// Global allocation grid is 4 bytes so memory maps cleanly to Int32Array/Float32Array views.
// float64 declarations require an even word offset (2-word boundary) so their byteAddress is
// divisible by 8, enabling safe Float64Array / DataView access. Any required alignment gap
// (0 or 1 word) is absorbed into the float64 entry's wordAlignedSize.
export const GLOBAL_ALIGNMENT_BOUNDARY = 4;
export const HEADER = [0x00, 0x61, 0x73, 0x6d];
export const VERSION = [0x01, 0x00, 0x00, 0x00];
// Number of exported WASM functions (init, cycle, initOnly, buffer)
export const EXPORTED_FUNCTION_COUNT = 4;
