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

function formatGlyph(glyph, charCode) {
	const charSymbol = charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '';
	const comment = charSymbol ? ` // ${charCode} '${charSymbol}'` : ` // ${charCode}`;
	const lines = [`\t[${comment}`];
	glyph.forEach(row => {
		lines.push(`\t\t'${row}',`);
	});
	lines.push('\t],');
	return lines.join('\n');
}

console.log("import { asciiGlyphsToFont } from '../ascii-converter';");
console.log('');
console.log('const glyphs = [');

// Include the exact font array from 8x16/ascii.ts here...
// I'll need to extract it from the source file
const fs = await import('fs');
const content = fs.readFileSync('src/fonts/8x16/ascii.ts', 'utf8');

// Extract the array definition (between 'export default [' and '].flat();')
const startMarker = 'export default [';
const endMarker = '].flat();';
const startIdx = content.indexOf(startMarker) + startMarker.length;
const endIdx = content.indexOf(endMarker);
const arrayContent = content.substring(startIdx, endIdx + 1);

// Evaluate the array
const font8x16 = eval('[' + arrayContent + '].flat()');

// Convert to ASCII art
for (let i = 0; i < 128; i++) {
	const start = i * 16;
	const bitmap = font8x16.slice(start, start + 16);
	const glyph = bitmapToAscii(bitmap, 8);
	console.log(formatGlyph(glyph, i));
}

console.log('];');
console.log('');
console.log('export default asciiGlyphsToFont(glyphs, 8);');
