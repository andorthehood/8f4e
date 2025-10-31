#!/usr/bin/env node

// Helper functions
function pad(paddingLeft, arr, paddingRight = 0) {
	return [...new Array(paddingLeft).fill(0), ...arr, ...new Array(paddingRight).fill(0)];
}

function same(byte, times) {
	return new Array(times).fill(byte).flat();
}

function mirr(toBeMirrored, middle = []) {
	return [...toBeMirrored, ...middle, ...toBeMirrored.slice().reverse()];
}

function invert(bytes) {
	return bytes.map(byte => ~byte);
}

function bitmapToAscii(bitmap, width) {
	return bitmap.map(byte => {
		let row = '';
		for (let i = 0; i < width; i++) {
			const mask = 1 << (width - 1 - i);
			row += (byte & mask) ? '#' : ' ';
		}
		return row;
	});
}

function formatGlyph(glyph, index) {
	const lines = [`\t[ // ${index}`];
	glyph.forEach(row => {
		lines.push(`\t\t'${row}',`);
	});
	lines.push('\t],');
	return lines.join('\n');
}

// Font array from 8x16/glyphs.ts
const font8x16Glyphs = [
	pad(16, []), // SPACE
	[...same(0b00000000, 7), 0b00011000, 0b00011000, ...same(0b00000000, 7)], // DOT
	[0b00011000, 0b00011000, 0b00100100, 0b00100100, 0b01000010, 0b01000010, ...same(0b00000000, 10)], // ARROW_TOP
	pad(8, [...mirr([0b00011000, 0b00000110], [0b00000001])], 3), // ARROW_RIGHT
	[...same(0b00000000, 10), 0b01000010, 0b01000010, 0b00100100, 0b00100100, 0b00011000, 0b00011000], // ARROW_BOTTOM
	pad(8, [...mirr([0b00000011, 0b00001100], [0b00010000])], 3), // ARROW_LEFT
	pad(4, [0b00111100, ...same(0b00110000, 8), 0b00111100], 2), // CONNECTOR_LEFT
	pad(4, [0b01111000, ...same(0b00011000, 8), 0b01111000], 2), // CONNECTOR_RIGHT
	pad(5, [...same(0b01101100, 2), 0b11111110, ...same(0b01101100, 2), 0b11111110, ...same(0b01101100, 2)], 3), // SWITCH_KNOB
	same(0b11111111, 16), // FILL
	same([0b10101010, 0b01010101], 8), // SEMI_FILL
	[...same([0b10101010, 0b01000100, 0b10101010, 0b00010001], 4)], // DITHER_1
	[...same([0b10101010, 0b01000100, 0b10101010, 0b00000000], 4)], // DITHER_2
	[...same([0b10101010, 0b00000000], 8)], // DITHER_3
	[...same([0b00100010, 0b00000000, 0b10101010, 0b00000000], 4)], // DITHER_4
	[...same([0b00100010, 0b00000000, 0b10001000, 0b00000000], 4)], // DITHER_5
	same(0b11110000, 16), // THICK_LINE_LEFT,
	same(0b00001111, 16), // THICK_LINE_RIGHT
	same(0b11000000, 16), // SLIM_LINE_LEFT
	same(0b00000011, 16), // SLIM_LINE_RIGHT
	invert(
		pad(
			3,
			[
				0b00000110, 0b00000110, 0b00001100, 0b00001100, 0b00011000, 0b00011000, 0b00110000, 0b00110000, 0b01100000,
				0b01100000,
			],
			3
		)
	), // SLASH
].flat();

console.log("import { asciiGlyphsToFont } from '../ascii-converter';");
console.log('');
console.log('const glyphs = [');

// Convert to ASCII art
const numGlyphs = font8x16Glyphs.length / 16;
for (let i = 0; i < numGlyphs; i++) {
	const start = i * 16;
	const bitmap = font8x16Glyphs.slice(start, start + 16);
	const glyph = bitmapToAscii(bitmap, 8);
	console.log(formatGlyph(glyph, i));
}

console.log('];');
console.log('');
console.log('export default asciiGlyphsToFont(glyphs, 8);');
