import { decodeBase64ToUint8Array } from './decodeBase64ToUint8Array';

/**
 * Decodes base64 data into an Int32Array view.
 * Throws if the byte length is not divisible by 4.
 */
export function decodeBase64ToInt32Array(base64Data: string): Int32Array {
	const uint8Array = decodeBase64ToUint8Array(base64Data);

	if (uint8Array.byteLength % 4 !== 0) {
		throw new Error('Invalid base64 data: byte length must be a multiple of 4 to decode as Int32Array');
	}

	return new Int32Array(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength / 4);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('decodeBase64ToInt32Array', () => {
		it('decodes empty payloads', () => {
			expect(decodeBase64ToInt32Array('')).toEqual(new Int32Array(0));
		});

		it('decodes little-endian integers', () => {
			expect(decodeBase64ToInt32Array('AQAAAAIAAAADAAAA')).toEqual(new Int32Array([1, 2, 3]));
		});

		it('throws when byte length is invalid', () => {
			expect(() => decodeBase64ToInt32Array('AQID')).toThrow(
				'Invalid base64 data: byte length must be a multiple of 4 to decode as Int32Array'
			);
		});
	});
}
