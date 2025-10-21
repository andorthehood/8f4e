/**
 * Decodes base64 data and returns a Uint8Array
 * This function can be easily swapped between different implementations
 * for testing and optimization purposes.
 */
export function decodeBase64ToUint8Array(base64Data: string): Uint8Array {
	return Uint8Array.from(
		atob(base64Data)
			.split('')
			.map(char => char.charCodeAt(0))
	);
}

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
