/**
 * Decodes base64 data into a Uint8Array instance.
 * Handles binary payloads that may be too large for spread syntax conversion.
 */
export function decodeBase64ToUint8Array(base64Data: string): Uint8Array {
	return Uint8Array.from(
		atob(base64Data)
			.split('')
			.map(char => char.charCodeAt(0))
	);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('decodeBase64ToUint8Array', () => {
		it('decodes empty payloads', () => {
			expect(decodeBase64ToUint8Array('')).toEqual(new Uint8Array(0));
		});

		it('decodes ASCII text', () => {
			expect(decodeBase64ToUint8Array('SGVsbG8=')).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
		});

		it('decodes binary data', () => {
			expect(decodeBase64ToUint8Array('AAECA/8=')).toEqual(new Uint8Array([0, 1, 2, 3, 255]));
		});

		it('decodes single byte payloads', () => {
			expect(decodeBase64ToUint8Array('QQ==')).toEqual(new Uint8Array([65]));
		});

		it('decodes multi-byte payloads', () => {
			expect(decodeBase64ToUint8Array('QUI=')).toEqual(new Uint8Array([65, 66]));
			expect(decodeBase64ToUint8Array('QUJD')).toEqual(new Uint8Array([65, 66, 67]));
		});

		it('decodes larger payloads', () => {
			expect(decodeBase64ToUint8Array('AQIDBAUGBwgJCg==')).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
		});

		it('handles padding and no-padding encodings', () => {
			expect(decodeBase64ToUint8Array('VGVzdA==')).toEqual(new Uint8Array([84, 101, 115, 116]));
			expect(decodeBase64ToUint8Array('VGVzdA')).toEqual(new Uint8Array([84, 101, 115, 116]));
		});

		it('decodes zeros and max byte values', () => {
			expect(decodeBase64ToUint8Array('AAAAAA==')).toEqual(new Uint8Array([0, 0, 0, 0]));
			expect(decodeBase64ToUint8Array('/////w==')).toEqual(new Uint8Array([255, 255, 255, 255]));
		});
	});
}
