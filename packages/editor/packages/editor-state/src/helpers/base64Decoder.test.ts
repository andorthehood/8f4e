import { describe, it, expect } from 'vitest';

import { decodeBase64ToFloat32Array, decodeBase64ToInt32Array, decodeBase64ToUint8Array } from './base64Decoder';

describe('decodeBase64ToUint8Array', () => {
	it('should decode empty base64 string to empty Uint8Array', () => {
		const result = decodeBase64ToUint8Array('');
		expect(result).toEqual(new Uint8Array(0));
	});

	it('should decode simple ASCII text', () => {
		// "Hello" in base64
		const result = decodeBase64ToUint8Array('SGVsbG8=');
		expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
	});

	it('should decode binary data', () => {
		// Binary data: [0, 1, 2, 3, 255] in base64
		const result = decodeBase64ToUint8Array('AAECA/8=');
		expect(result).toEqual(new Uint8Array([0, 1, 2, 3, 255]));
	});

	it('should decode single byte', () => {
		// Single byte: 65 (ASCII 'A') in base64
		const result = decodeBase64ToUint8Array('QQ==');
		expect(result).toEqual(new Uint8Array([65]));
	});

	it('should decode two bytes', () => {
		// Two bytes: [65, 66] (ASCII 'AB') in base64
		const result = decodeBase64ToUint8Array('QUI=');
		expect(result).toEqual(new Uint8Array([65, 66]));
	});

	it('should decode three bytes', () => {
		// Three bytes: [65, 66, 67] (ASCII 'ABC') in base64
		const result = decodeBase64ToUint8Array('QUJD');
		expect(result).toEqual(new Uint8Array([65, 66, 67]));
	});

	it('should decode larger binary data', () => {
		// Test with a known base64 string that represents more complex data
		// This is the base64 encoding of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
		const result = decodeBase64ToUint8Array('AQIDBAUGBwgJCg==');
		expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
	});

	it('should handle base64 with padding', () => {
		// "Test" in base64 with padding
		const result = decodeBase64ToUint8Array('VGVzdA==');
		expect(result).toEqual(new Uint8Array([84, 101, 115, 116]));
	});

	it('should handle base64 without padding', () => {
		// "Test" in base64 without padding
		const result = decodeBase64ToUint8Array('VGVzdA');
		expect(result).toEqual(new Uint8Array([84, 101, 115, 116]));
	});

	it('should decode zero bytes correctly', () => {
		// Array of zeros: [0, 0, 0, 0] in base64
		const result = decodeBase64ToUint8Array('AAAAAA==');
		expect(result).toEqual(new Uint8Array([0, 0, 0, 0]));
	});

	it('should decode maximum byte values', () => {
		// Array of 255s: [255, 255, 255, 255] in base64
		const result = decodeBase64ToUint8Array('/////w==');
		expect(result).toEqual(new Uint8Array([255, 255, 255, 255]));
	});
});

describe('decodeBase64ToFloat32Array', () => {
	it('should decode empty base64 string to empty Float32Array', () => {
		const result = decodeBase64ToFloat32Array('');
		expect(result).toEqual(new Float32Array(0));
	});

	it('should decode little-endian float32 values', () => {
		// Encoded bytes for Float32Array [1.5, -2.25, 0.5]
		const result = decodeBase64ToFloat32Array('AADAPwAAEMAAAAA/');
		expect(result).toEqual(new Float32Array([1.5, -2.25, 0.5]));
	});

	it('should throw when byte length is not divisible by 4', () => {
		expect(() => decodeBase64ToFloat32Array('AQID')).toThrow(
			'Invalid base64 data: byte length must be a multiple of 4 to decode as Float32Array'
		);
	});
});

describe('decodeBase64ToInt32Array', () => {
	it('should decode empty base64 string to empty Int32Array', () => {
		const result = decodeBase64ToInt32Array('');
		expect(result).toEqual(new Int32Array(0));
	});

	it('should decode little-endian integers', () => {
		// Encoded bytes: [1,0,0,0, 2,0,0,0, 3,0,0,0]
		const result = decodeBase64ToInt32Array('AQAAAAIAAAADAAAA');
		expect(result).toEqual(new Int32Array([1, 2, 3]));
	});

	it('should throw when byte length is not divisible by 4', () => {
		expect(() => decodeBase64ToInt32Array('AQID')).toThrow(
			'Invalid base64 data: byte length must be a multiple of 4 to decode as Int32Array'
		);
	});
});
