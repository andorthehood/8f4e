/**
 * Encodes Uint8Array data to base64 string in chunks to avoid stack overflow
 * This function processes large arrays safely without using the spread operator
 */
export function encodeUint8ArrayToBase64(uint8Array: Uint8Array): string {
	const CHUNK_SIZE = 8192; // Process 8KB chunks to avoid stack overflow
	let result = '';
	
	for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
		const chunk = uint8Array.slice(i, i + CHUNK_SIZE);
		const binaryString = String.fromCharCode.apply(null, Array.from(chunk));
		result += binaryString;
	}
	
	return btoa(result);
}