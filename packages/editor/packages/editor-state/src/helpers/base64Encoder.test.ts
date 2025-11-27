import { describe, it, expect } from 'vitest';

import { encodeUint8ArrayToBase64 } from './base64Encoder';
import { decodeBase64ToUint8Array } from './base64Decoder';

describe('base64Encoder', () => {
	it('should encode small arrays correctly', () => {
		const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
		const encoded = encodeUint8ArrayToBase64(testData);
		const expected = btoa('Hello');
		expect(encoded).toBe(expected);
	});

	it('should encode and decode round-trip correctly', () => {
		const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		const encoded = encodeUint8ArrayToBase64(testData);
		const decoded = decodeBase64ToUint8Array(encoded);
		expect(decoded).toEqual(testData);
	});

	it('should handle large arrays without stack overflow', () => {
		// Create a large array (50KB) to test chunking
		const largeArray = new Uint8Array(50000);
		for (let i = 0; i < largeArray.length; i++) {
			largeArray[i] = i % 256;
		}

		// This should not throw a stack overflow error
		expect(() => {
			const encoded = encodeUint8ArrayToBase64(largeArray);
			expect(typeof encoded).toBe('string');
			expect(encoded.length).toBeGreaterThan(0);
		}).not.toThrow();
	});

	it('should handle empty arrays', () => {
		const emptyArray = new Uint8Array(0);
		const encoded = encodeUint8ArrayToBase64(emptyArray);
		expect(encoded).toBe('');
	});

	it('should produce same result as btoa for small arrays', () => {
		const testData = new Uint8Array([65, 66, 67, 68]); // "ABCD"
		const encoded = encodeUint8ArrayToBase64(testData);
		const expected = btoa(String.fromCharCode(...testData));
		expect(encoded).toBe(expected);
	});
});
