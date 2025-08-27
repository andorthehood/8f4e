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
