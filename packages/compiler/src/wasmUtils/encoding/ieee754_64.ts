/**
 * Converts a JavaScript number to IEEE 754 double-precision (64-bit) floating-point format.
 * Returns bytes in little-endian format.
 *
 * @param n - The number to convert
 * @returns A Uint8Array containing the little-endian byte representation
 */
const ieee754_64 = (n: number): Uint8Array => {
	const buf = new ArrayBuffer(8);
	const view = new DataView(buf);
	view.setFloat64(0, n, true);
	return new Uint8Array(buf);
};

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('ieee754_64 converts double-precision floats correctly', () => {
		expect(Array.from(ieee754_64(0))).toStrictEqual([0, 0, 0, 0, 0, 0, 0, 0]);
		expect(Array.from(ieee754_64(1))).toStrictEqual([0, 0, 0, 0, 0, 0, 240, 63]);
		expect(Array.from(ieee754_64(-1))).toStrictEqual([0, 0, 0, 0, 0, 0, 240, 191]);
		expect(Array.from(ieee754_64(3.14))).toStrictEqual([31, 133, 235, 81, 184, 30, 9, 64]);
	});
}

export default ieee754_64;
