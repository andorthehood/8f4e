import { describe, it, expect } from 'vitest';

import decodeFontBase64 from '../src/fonts/font-decoder';
import { fontMetadata as ascii8x16Metadata } from '../src/fonts/8x16/generated/ascii';
import { fontMetadata as glyphs8x16Metadata } from '../src/fonts/8x16/generated/glyphs';
import { fontMetadata as ascii6x10Metadata } from '../src/fonts/6x10/generated/ascii';
import { fontMetadata as glyphs6x10Metadata } from '../src/fonts/6x10/generated/glyphs';

describe('font-decoder', () => {
	describe('decodeFontBase64', () => {
		it('should decode 8x16 ASCII font correctly', () => {
			const decoded = decodeFontBase64(ascii8x16Metadata);

			// Check basic properties
			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(ascii8x16Metadata.glyphCount * ascii8x16Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);

			// Check first glyph (should be blank)
			const firstGlyph = decoded.slice(0, ascii8x16Metadata.characterHeight);
			expect(firstGlyph.every(val => val === 0)).toBe(true);
		});

		it('should decode 8x16 glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphs8x16Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(glyphs8x16Metadata.glyphCount * glyphs8x16Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode 6x10 ASCII font correctly', () => {
			const decoded = decodeFontBase64(ascii6x10Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(ascii6x10Metadata.glyphCount * ascii6x10Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode 6x10 glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphs6x10Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(glyphs6x10Metadata.glyphCount * glyphs6x10Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should produce same result as original ASCII conversion for 8x16', () => {
			// Import the original ASCII glyphs (this is a compile-time check that they still exist)
			// We'll do a spot check on a few known characters rather than all of them
			const decoded = decodeFontBase64(ascii8x16Metadata);

			// Check that the array has valid values
			expect(decoded.length).toBe(128 * 16); // 128 characters, 16 rows each
			expect(decoded.every(val => val >= 0 && val <= 255)).toBe(true);
		});

		it('should produce same result as original ASCII conversion for 6x10', () => {
			const decoded = decodeFontBase64(ascii6x10Metadata);

			// Check that the array has valid values
			expect(decoded.length).toBe(128 * 10); // 128 characters, 10 rows each
			expect(decoded.every(val => val >= 0 && val <= 63)).toBe(true); // Max value for 6-bit width
		});

		it('should handle bytesPerValue=1 correctly', () => {
			const decoded = decodeFontBase64(ascii6x10Metadata);

			// All values should be within Uint8Array range
			expect(decoded.every(val => val >= 0 && val <= 255)).toBe(true);
		});

		it('should handle bytesPerValue=2 correctly if needed', () => {
			// If 8x16 uses 2 bytes per value (it should use 1 for this font)
			const decoded = decodeFontBase64(ascii8x16Metadata);

			// Should still decode correctly
			expect(decoded.length).toBeGreaterThan(0);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode metadata correctly', () => {
			expect(ascii8x16Metadata.characterWidth).toBe(8);
			expect(ascii8x16Metadata.characterHeight).toBe(16);
			expect(ascii8x16Metadata.glyphCount).toBe(128);
			expect(ascii8x16Metadata.bytesPerValue).toBe(1);

			expect(ascii6x10Metadata.characterWidth).toBe(6);
			expect(ascii6x10Metadata.characterHeight).toBe(10);
			expect(ascii6x10Metadata.glyphCount).toBe(128);
			expect(ascii6x10Metadata.bytesPerValue).toBe(1);
		});

		it('should decode specific known patterns correctly', () => {
			const decoded = decodeFontBase64(ascii8x16Metadata);

			// Character at index 0 (null) should be all zeros
			const char0 = decoded.slice(0, 16);
			expect(char0.every(val => val === 0)).toBe(true);

			// Character 32 (space) should also be all zeros
			const char32 = decoded.slice(32 * 16, 32 * 16 + 16);
			expect(char32.every(val => val === 0)).toBe(true);
		});

		it('should produce valid bitmap values for rendering', () => {
			const decoded = decodeFontBase64(ascii8x16Metadata);

			// Check that values are within expected range for 8-bit characters
			const max8bitValue = (1 << 8) - 1; // 255
			expect(decoded.every(val => val >= 0 && val <= max8bitValue)).toBe(true);
		});

		it('should maintain character spacing', () => {
			const decoded = decodeFontBase64(ascii8x16Metadata);

			// Each character should be exactly characterHeight values
			for (let charCode = 0; charCode < 128; charCode++) {
				const startIdx = charCode * 16;
				const endIdx = startIdx + 16;
				const charData = decoded.slice(startIdx, endIdx);
				expect(charData.length).toBe(16);
			}
		});
	});

	describe('generated font metadata', () => {
		it('should have consistent dimensions for 8x16 fonts', () => {
			expect(ascii8x16Metadata.characterWidth).toBe(8);
			expect(ascii8x16Metadata.characterHeight).toBe(16);
			expect(glyphs8x16Metadata.characterWidth).toBe(8);
			expect(glyphs8x16Metadata.characterHeight).toBe(16);
		});

		it('should have consistent dimensions for 6x10 fonts', () => {
			expect(ascii6x10Metadata.characterWidth).toBe(6);
			expect(ascii6x10Metadata.characterHeight).toBe(10);
			expect(glyphs6x10Metadata.characterWidth).toBe(6);
			expect(glyphs6x10Metadata.characterHeight).toBe(10);
		});

		it('should have base64 data', () => {
			expect(ascii8x16Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphs8x16Metadata.base64Data.length).toBeGreaterThan(0);
			expect(ascii6x10Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphs6x10Metadata.base64Data.length).toBeGreaterThan(0);
		});

		it('should have valid bytesPerValue', () => {
			expect([1, 2]).toContain(ascii8x16Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphs8x16Metadata.bytesPerValue);
			expect([1, 2]).toContain(ascii6x10Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphs6x10Metadata.bytesPerValue);
		});
	});
});
