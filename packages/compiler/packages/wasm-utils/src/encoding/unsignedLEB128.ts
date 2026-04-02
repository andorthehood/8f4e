/**
 * Encodes an unsigned integer using LEB128 (Little Endian Base 128) variable-length encoding.
 *
 * LEB128 is a variable-length code compression format used by WebAssembly for encoding all integer literals.
 * Each byte encodes 7 bits of the integer with a continuation bit in the MSB.
 *
 * @param n - The unsigned integer to encode
 * @returns An array of bytes representing the LEB128-encoded value
 */
export default function unsignedLEB128(n: number): number[] {
	const buffer: number[] = [];
	do {
		let byte = n & 0b1111111;
		n >>>= 7;
		if (n !== 0) {
			byte |= 0b10000000;
		}
		buffer.push(byte);
	} while (n !== 0);
	return buffer;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('unsignedLEB128 encodes small values in single byte', () => {
		expect(unsignedLEB128(0)).toStrictEqual([0]);
		expect(unsignedLEB128(10)).toStrictEqual([10]);
	});

	test('unsignedLEB128 encodes larger values with continuation bytes', () => {
		expect(unsignedLEB128(127)).toStrictEqual([127]);
		expect(unsignedLEB128(128)).toStrictEqual([128, 1]);
		expect(unsignedLEB128(256)).toStrictEqual([128, 2]);
	});
}
