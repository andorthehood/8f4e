import unsignedLEB128 from './unsignedLEB128';

/**
 * Creates a WebAssembly vector by prefixing data with its length.
 *
 * @param data - The data to encode as a vector
 * @returns An array of bytes containing the length-prefixed data
 */
export default function createVector(data: number[]): number[] {
	return [...unsignedLEB128(data.length), ...data];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createVector prefixes data with length', () => {
		expect(createVector([1, 2, 3])).toStrictEqual([3, 1, 2, 3]);
		expect(createVector([42])).toStrictEqual([1, 42]);
	});

	test('createVector handles empty data', () => {
		expect(createVector([])).toStrictEqual([0]);
	});
}
