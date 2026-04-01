/**
 * Converts a JavaScript number to IEEE 754 single-precision (32-bit) floating-point format.
 * Returns bytes in little-endian format.
 *
 * @param n - The number to convert
 * @returns A Uint8Array containing the little-endian byte representation
 */
const ieee754 = (n: number): Uint8Array => {
	const buf = new ArrayBuffer(4);
	const view = new DataView(buf);
	view.setFloat32(0, n, true);
	return new Uint8Array(buf);
};

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('ieee754 converts single-precision floats correctly', () => {
		expect(Array.from(ieee754(1))).toStrictEqual([0, 0, 128, 63]);
		expect(Array.from(ieee754(32))).toStrictEqual([0, 0, 0, 66]);
		expect(Array.from(ieee754(256))).toStrictEqual([0, 0, 128, 67]);
		expect(Array.from(ieee754(-1))).toStrictEqual([0, 0, 128, 191]);
		expect(Array.from(ieee754(-256))).toStrictEqual([0, 0, 128, 195]);
		expect(Array.from(ieee754(3.14))).toStrictEqual([195, 245, 72, 64]);
	});
}

export default ieee754;
