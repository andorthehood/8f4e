import { decodeBase64ToUint8Array } from './decodeBase64ToUint8Array';

/**
 * Decodes base64 data into a Float32Array view.
 * Throws if the byte length is not divisible by 4.
 */
export function decodeBase64ToFloat32Array(base64Data: string): Float32Array {
	const uint8Array = decodeBase64ToUint8Array(base64Data);

	if (uint8Array.byteLength % 4 !== 0) {
		throw new Error('Invalid base64 data: byte length must be a multiple of 4 to decode as Float32Array');
	}

	return new Float32Array(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength / 4);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('decodeBase64ToFloat32Array', () => {
		it('decodes empty payloads', () => {
			expect(decodeBase64ToFloat32Array('')).toEqual(new Float32Array(0));
		});

		it('decodes little-endian float32 values', () => {
			expect(decodeBase64ToFloat32Array('AADAPwAAEMAAAAA/')).toEqual(new Float32Array([1.5, -2.25, 0.5]));
		});

		it('throws when byte length is invalid', () => {
			expect(() => decodeBase64ToFloat32Array('AQID')).toThrow(
				'Invalid base64 data: byte length must be a multiple of 4 to decode as Float32Array'
			);
		});
	});
}
