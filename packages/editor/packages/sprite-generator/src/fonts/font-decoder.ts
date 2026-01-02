/**
 * Runtime decoder for Base64-encoded font bitmaps.
 * Converts the compact Base64 format back to the number[] format expected by the rendering system.
 */

import type { FontMetadata } from './8x16/generated/ascii';

/**
 * Decodes a Base64-encoded font bitmap back to a number array.
 *
 * @param metadata - Font metadata containing the Base64 data and format information
 * @returns Array of numbers representing the bitmap in the same format as asciiGlyphsToFont output
 *
 * @example
 * ```ts
 * import { fontMetadata } from './fonts/8x16/generated/ascii';
 * import decodeFontBase64 from './fonts/font-decoder';
 *
 * const bitmap = decodeFontBase64(fontMetadata);
 * // bitmap is now a number[] ready for rendering
 * ```
 */
export default function decodeFontBase64(metadata: FontMetadata): number[] {
	// Decode base64 to binary
	const binaryString = atob(metadata.base64Data);

	// Convert binary string to appropriate typed array based on bytesPerValue
	if (metadata.bytesPerValue === 1) {
		// 8-bit values (Uint8Array)
		const uint8Array = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			uint8Array[i] = binaryString.charCodeAt(i);
		}
		return Array.from(uint8Array);
	} else {
		// 16-bit values (Uint16Array)
		const uint8Array = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			uint8Array[i] = binaryString.charCodeAt(i);
		}
		const uint16Array = new Uint16Array(uint8Array.buffer);
		return Array.from(uint16Array);
	}
}
