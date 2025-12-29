import { unsignedLEB128 } from './unsignedLEB128';

/**
 * Encodes a string as a WebAssembly vector: length prefix followed by UTF-8 bytes.
 *
 * @param str - The string to encode
 * @returns An array of bytes containing the length-prefixed string data
 */
export function encodeString(str: string): number[] {
	return [...unsignedLEB128(str.length), ...str.split('').map(char => char.charCodeAt(0))];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('encodeString prefixes string with length', () => {
		expect(encodeString('a')).toStrictEqual([1, 97]);
		expect(encodeString('ab')).toStrictEqual([2, 97, 98]);
	});

	test('encodeString handles empty string', () => {
		expect(encodeString('')).toStrictEqual([0]);
	});

	test('encodeString handles longer strings', () => {
		const result = encodeString('hello');
		expect(result).toStrictEqual([5, 104, 101, 108, 108, 111]);
	});
}
