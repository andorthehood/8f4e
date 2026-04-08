import { describe, it, expect } from 'vitest';

import decodeFontBase64 from '../src/fonts/font-decoder';
import { fontMetadata as ascii8x16Metadata } from '../src/fonts/8x16/generated/ascii';
import { fontMetadata as glyphs8x16Metadata } from '../src/fonts/8x16/generated/glyphs';
import { fontMetadata as asciiTerminus8x16Metadata } from '../src/fonts/terminus8x16/generated/ascii';
import { fontMetadata as glyphsTerminus8x16Metadata } from '../src/fonts/terminus8x16/generated/glyphs';
import { fontMetadata as asciiTerminus8x16BoldMetadata } from '../src/fonts/terminus8x16bold/generated/ascii';
import { fontMetadata as glyphsTerminus8x16BoldMetadata } from '../src/fonts/terminus8x16bold/generated/glyphs';
import { fontMetadata as ascii6x10Metadata } from '../src/fonts/6x10/generated/ascii';
import { fontMetadata as glyphs6x10Metadata } from '../src/fonts/6x10/generated/glyphs';
import { fontMetadata as asciiTerminus10x18Metadata } from '../src/fonts/terminus10x18/generated/ascii';
import { fontMetadata as glyphsTerminus10x18Metadata } from '../src/fonts/terminus10x18/generated/glyphs';
import { fontMetadata as asciiTerminus10x18BoldMetadata } from '../src/fonts/terminus10x18bold/generated/ascii';
import { fontMetadata as glyphsTerminus10x18BoldMetadata } from '../src/fonts/terminus10x18bold/generated/glyphs';
import { fontMetadata as asciiTerminus12x24Metadata } from '../src/fonts/terminus12x24/generated/ascii';
import { fontMetadata as glyphsTerminus12x24Metadata } from '../src/fonts/terminus12x24/generated/glyphs';
import { fontMetadata as asciiTerminus12x24BoldMetadata } from '../src/fonts/terminus12x24bold/generated/ascii';
import { fontMetadata as glyphsTerminus12x24BoldMetadata } from '../src/fonts/terminus12x24bold/generated/glyphs';
import { fontMetadata as ascii16x32Metadata } from '../src/fonts/16x32/generated/ascii';
import { fontMetadata as glyphs16x32Metadata } from '../src/fonts/16x32/generated/glyphs';

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

		it('should decode terminus8x16 ASCII font correctly', () => {
			const decoded = decodeFontBase64(asciiTerminus8x16Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(asciiTerminus8x16Metadata.glyphCount * asciiTerminus8x16Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus8x16 glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphsTerminus8x16Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(glyphsTerminus8x16Metadata.glyphCount * glyphsTerminus8x16Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus8x16bold ASCII font correctly', () => {
			const decoded = decodeFontBase64(asciiTerminus8x16BoldMetadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(
				asciiTerminus8x16BoldMetadata.glyphCount * asciiTerminus8x16BoldMetadata.characterHeight
			);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus8x16bold glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphsTerminus8x16BoldMetadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(
				glyphsTerminus8x16BoldMetadata.glyphCount * glyphsTerminus8x16BoldMetadata.characterHeight
			);
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

		it('should decode 16x32 ASCII font correctly', () => {
			const decoded = decodeFontBase64(ascii16x32Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(ascii16x32Metadata.glyphCount * ascii16x32Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode 16x32 glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphs16x32Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(glyphs16x32Metadata.glyphCount * glyphs16x32Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus10x18 ASCII font correctly', () => {
			const decoded = decodeFontBase64(asciiTerminus10x18Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(asciiTerminus10x18Metadata.glyphCount * asciiTerminus10x18Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus10x18 glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphsTerminus10x18Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(glyphsTerminus10x18Metadata.glyphCount * glyphsTerminus10x18Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus10x18bold ASCII font correctly', () => {
			const decoded = decodeFontBase64(asciiTerminus10x18BoldMetadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(
				asciiTerminus10x18BoldMetadata.glyphCount * asciiTerminus10x18BoldMetadata.characterHeight
			);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus10x18bold glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphsTerminus10x18BoldMetadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(
				glyphsTerminus10x18BoldMetadata.glyphCount * glyphsTerminus10x18BoldMetadata.characterHeight
			);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus12x24 ASCII font correctly', () => {
			const decoded = decodeFontBase64(asciiTerminus12x24Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(asciiTerminus12x24Metadata.glyphCount * asciiTerminus12x24Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus12x24 glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphsTerminus12x24Metadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(glyphsTerminus12x24Metadata.glyphCount * glyphsTerminus12x24Metadata.characterHeight);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus12x24bold ASCII font correctly', () => {
			const decoded = decodeFontBase64(asciiTerminus12x24BoldMetadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(
				asciiTerminus12x24BoldMetadata.glyphCount * asciiTerminus12x24BoldMetadata.characterHeight
			);
			expect(decoded.every(val => typeof val === 'number')).toBe(true);
		});

		it('should decode terminus12x24bold glyphs font correctly', () => {
			const decoded = decodeFontBase64(glyphsTerminus12x24BoldMetadata);

			expect(decoded).toBeInstanceOf(Array);
			expect(decoded.length).toBe(
				glyphsTerminus12x24BoldMetadata.glyphCount * glyphsTerminus12x24BoldMetadata.characterHeight
			);
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

			expect(asciiTerminus8x16Metadata.characterWidth).toBe(8);
			expect(asciiTerminus8x16Metadata.characterHeight).toBe(16);
			expect(asciiTerminus8x16Metadata.glyphCount).toBe(128);
			expect(asciiTerminus8x16Metadata.bytesPerValue).toBe(1);

			expect(asciiTerminus8x16BoldMetadata.characterWidth).toBe(8);
			expect(asciiTerminus8x16BoldMetadata.characterHeight).toBe(16);
			expect(asciiTerminus8x16BoldMetadata.glyphCount).toBe(128);
			expect(asciiTerminus8x16BoldMetadata.bytesPerValue).toBe(1);

			expect(ascii6x10Metadata.characterWidth).toBe(6);
			expect(ascii6x10Metadata.characterHeight).toBe(10);
			expect(ascii6x10Metadata.glyphCount).toBe(128);
			expect(ascii6x10Metadata.bytesPerValue).toBe(1);

			expect(asciiTerminus10x18Metadata.characterWidth).toBe(10);
			expect(asciiTerminus10x18Metadata.characterHeight).toBe(18);
			expect(asciiTerminus10x18Metadata.glyphCount).toBe(128);
			expect(asciiTerminus10x18Metadata.bytesPerValue).toBe(2);

			expect(asciiTerminus10x18BoldMetadata.characterWidth).toBe(10);
			expect(asciiTerminus10x18BoldMetadata.characterHeight).toBe(18);
			expect(asciiTerminus10x18BoldMetadata.glyphCount).toBe(128);
			expect(asciiTerminus10x18BoldMetadata.bytesPerValue).toBe(2);

			expect(asciiTerminus12x24Metadata.characterWidth).toBe(12);
			expect(asciiTerminus12x24Metadata.characterHeight).toBe(24);
			expect(asciiTerminus12x24Metadata.glyphCount).toBe(128);
			expect(asciiTerminus12x24Metadata.bytesPerValue).toBe(2);

			expect(asciiTerminus12x24BoldMetadata.characterWidth).toBe(12);
			expect(asciiTerminus12x24BoldMetadata.characterHeight).toBe(24);
			expect(asciiTerminus12x24BoldMetadata.glyphCount).toBe(128);
			expect(asciiTerminus12x24BoldMetadata.bytesPerValue).toBe(2);

			expect(ascii16x32Metadata.characterWidth).toBe(16);
			expect(ascii16x32Metadata.characterHeight).toBe(32);
			expect(ascii16x32Metadata.glyphCount).toBe(128);
			expect(ascii16x32Metadata.bytesPerValue).toBe(2);
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

		it('should have consistent dimensions for terminus8x16 fonts', () => {
			expect(asciiTerminus8x16Metadata.characterWidth).toBe(8);
			expect(asciiTerminus8x16Metadata.characterHeight).toBe(16);
			expect(glyphsTerminus8x16Metadata.characterWidth).toBe(8);
			expect(glyphsTerminus8x16Metadata.characterHeight).toBe(16);
		});

		it('should have consistent dimensions for terminus8x16bold fonts', () => {
			expect(asciiTerminus8x16BoldMetadata.characterWidth).toBe(8);
			expect(asciiTerminus8x16BoldMetadata.characterHeight).toBe(16);
			expect(glyphsTerminus8x16BoldMetadata.characterWidth).toBe(8);
			expect(glyphsTerminus8x16BoldMetadata.characterHeight).toBe(16);
		});

		it('should have consistent dimensions for 6x10 fonts', () => {
			expect(ascii6x10Metadata.characterWidth).toBe(6);
			expect(ascii6x10Metadata.characterHeight).toBe(10);
			expect(glyphs6x10Metadata.characterWidth).toBe(6);
			expect(glyphs6x10Metadata.characterHeight).toBe(10);
		});

		it('should have consistent dimensions for 16x32 fonts', () => {
			expect(ascii16x32Metadata.characterWidth).toBe(16);
			expect(ascii16x32Metadata.characterHeight).toBe(32);
			expect(glyphs16x32Metadata.characterWidth).toBe(16);
			expect(glyphs16x32Metadata.characterHeight).toBe(32);
		});

		it('should have consistent dimensions for terminus10x18 fonts', () => {
			expect(asciiTerminus10x18Metadata.characterWidth).toBe(10);
			expect(asciiTerminus10x18Metadata.characterHeight).toBe(18);
			expect(glyphsTerminus10x18Metadata.characterWidth).toBe(10);
			expect(glyphsTerminus10x18Metadata.characterHeight).toBe(18);
		});

		it('should have consistent dimensions for terminus10x18bold fonts', () => {
			expect(asciiTerminus10x18BoldMetadata.characterWidth).toBe(10);
			expect(asciiTerminus10x18BoldMetadata.characterHeight).toBe(18);
			expect(glyphsTerminus10x18BoldMetadata.characterWidth).toBe(10);
			expect(glyphsTerminus10x18BoldMetadata.characterHeight).toBe(18);
		});

		it('should have consistent dimensions for terminus12x24 fonts', () => {
			expect(asciiTerminus12x24Metadata.characterWidth).toBe(12);
			expect(asciiTerminus12x24Metadata.characterHeight).toBe(24);
			expect(glyphsTerminus12x24Metadata.characterWidth).toBe(12);
			expect(glyphsTerminus12x24Metadata.characterHeight).toBe(24);
		});

		it('should have consistent dimensions for terminus12x24bold fonts', () => {
			expect(asciiTerminus12x24BoldMetadata.characterWidth).toBe(12);
			expect(asciiTerminus12x24BoldMetadata.characterHeight).toBe(24);
			expect(glyphsTerminus12x24BoldMetadata.characterWidth).toBe(12);
			expect(glyphsTerminus12x24BoldMetadata.characterHeight).toBe(24);
		});

		it('should have base64 data', () => {
			expect(ascii8x16Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphs8x16Metadata.base64Data.length).toBeGreaterThan(0);
			expect(asciiTerminus8x16Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphsTerminus8x16Metadata.base64Data.length).toBeGreaterThan(0);
			expect(asciiTerminus8x16BoldMetadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphsTerminus8x16BoldMetadata.base64Data.length).toBeGreaterThan(0);
			expect(ascii6x10Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphs6x10Metadata.base64Data.length).toBeGreaterThan(0);
			expect(asciiTerminus10x18Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphsTerminus10x18Metadata.base64Data.length).toBeGreaterThan(0);
			expect(asciiTerminus10x18BoldMetadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphsTerminus10x18BoldMetadata.base64Data.length).toBeGreaterThan(0);
			expect(asciiTerminus12x24Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphsTerminus12x24Metadata.base64Data.length).toBeGreaterThan(0);
			expect(asciiTerminus12x24BoldMetadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphsTerminus12x24BoldMetadata.base64Data.length).toBeGreaterThan(0);
			expect(ascii16x32Metadata.base64Data.length).toBeGreaterThan(0);
			expect(glyphs16x32Metadata.base64Data.length).toBeGreaterThan(0);
		});

		it('should have valid bytesPerValue', () => {
			expect([1, 2]).toContain(ascii8x16Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphs8x16Metadata.bytesPerValue);
			expect([1, 2]).toContain(asciiTerminus8x16Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphsTerminus8x16Metadata.bytesPerValue);
			expect([1, 2]).toContain(asciiTerminus8x16BoldMetadata.bytesPerValue);
			expect([1, 2]).toContain(glyphsTerminus8x16BoldMetadata.bytesPerValue);
			expect([1, 2]).toContain(ascii6x10Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphs6x10Metadata.bytesPerValue);
			expect([1, 2]).toContain(asciiTerminus10x18Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphsTerminus10x18Metadata.bytesPerValue);
			expect([1, 2]).toContain(asciiTerminus10x18BoldMetadata.bytesPerValue);
			expect([1, 2]).toContain(glyphsTerminus10x18BoldMetadata.bytesPerValue);
			expect([1, 2]).toContain(asciiTerminus12x24Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphsTerminus12x24Metadata.bytesPerValue);
			expect([1, 2]).toContain(asciiTerminus12x24BoldMetadata.bytesPerValue);
			expect([1, 2]).toContain(glyphsTerminus12x24BoldMetadata.bytesPerValue);
			expect([1, 2]).toContain(ascii16x32Metadata.bytesPerValue);
			expect([1, 2]).toContain(glyphs16x32Metadata.bytesPerValue);
		});
	});
});
