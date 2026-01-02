/**
 * Encodes Uint8Array data to base64 string in chunks to avoid stack overflow
 * This function processes large arrays safely without using the spread operator
 */
export default function encodeUint8ArrayToBase64(uint8Array: Uint8Array): string {
	const CHUNK_SIZE = 8192; // Process 8KB chunks to avoid stack overflow
	let result = '';

	for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
		const chunk = uint8Array.slice(i, i + CHUNK_SIZE);
		const binaryString = String.fromCharCode.apply(null, Array.from(chunk));
		result += binaryString;
	}

	return btoa(result);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const decodeWithAtob = (value: string) =>
		Uint8Array.from(
			atob(value)
				.split('')
				.map(char => char.charCodeAt(0))
		);

	describe('encodeUint8ArrayToBase64', () => {
		it('encodes small arrays correctly', () => {
			const result = encodeUint8ArrayToBase64(new Uint8Array([72, 101, 108, 108, 111]));
			expect(result).toBe(btoa('Hello'));
		});

		it('round-trips arbitrary data against atob', () => {
			const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
			expect(decodeWithAtob(encodeUint8ArrayToBase64(payload))).toEqual(payload);
		});

		it('handles large arrays without stack overflow', () => {
			const largeArray = new Uint8Array(50000);
			for (let i = 0; i < largeArray.length; i += 1) {
				largeArray[i] = i % 256;
			}

			expect(() => {
				const encoded = encodeUint8ArrayToBase64(largeArray);
				expect(typeof encoded).toBe('string');
				expect(encoded.length).toBeGreaterThan(0);
			}).not.toThrow();
		});

		it('encodes empty arrays to empty strings', () => {
			expect(encodeUint8ArrayToBase64(new Uint8Array(0))).toBe('');
		});

		it('matches btoa for simple payloads', () => {
			const payload = new Uint8Array([65, 66, 67, 68]);
			expect(encodeUint8ArrayToBase64(payload)).toBe(btoa(String.fromCharCode(...payload)));
		});
	});
}
