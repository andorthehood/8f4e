#!/usr/bin/env node

/**
 * Script to convert existing numeric bitmap fonts to ASCII art format.
 * This script reads the compiled font data and outputs ASCII art representations.
 * 
 * Usage: node convert-font-to-ascii.mjs <fontPath> <characterWidth> <characterHeight>
 * Example: node convert-font-to-ascii.mjs ./src/fonts/6x10/ascii.ts 6 10
 */

import { bitmapToAscii } from '../dist/fonts/ascii-converter.js';

/**
 * Convert a flat font array to an array of ASCII art glyphs
 */
function fontToAsciiGlyphs(font, characterWidth, characterHeight) {
	const glyphs = [];
	const totalCharacters = font.length / characterHeight;

	for (let charIndex = 0; charIndex < totalCharacters; charIndex++) {
		const startRow = charIndex * characterHeight;
		const endRow = startRow + characterHeight;
		const bitmap = font.slice(startRow, endRow);
		const asciiGlyph = bitmapToAscii(bitmap, characterWidth);
		glyphs.push(asciiGlyph);
	}

	return glyphs;
}

/**
 * Format ASCII glyphs as TypeScript source code
 */
function formatAsTypeScript(glyphs, characterWidth) {
	const lines = ['export default ['];

	glyphs.forEach((glyph, index) => {
		const glyphLines = glyph.map(row => `\t\t'${row}',`).join('\n');
		const charCode = index;
		const charSymbol = charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '';
		const comment = charSymbol ? ` // ${charCode} '${charSymbol}'` : ` // ${charCode}`;

		lines.push(`\t[${comment}`);
		lines.push(glyphLines);
		lines.push(`\t],`);
	});

	lines.push('];');
	return lines.join('\n');
}

/**
 * Main conversion function
 */
async function convertFont(fontPath, characterWidth, characterHeight) {
	try {
		// Dynamically import the font module
		const fontModule = await import(fontPath);
		const font = fontModule.default;

		console.log(`Converting font from ${fontPath}`);
		console.log(`Character dimensions: ${characterWidth}x${characterHeight}`);
		console.log(`Total bytes: ${font.length}`);
		console.log(`Total characters: ${font.length / characterHeight}\n`);

		// Convert to ASCII glyphs
		const glyphs = fontToAsciiGlyphs(font, characterWidth, characterHeight);

		// Format as TypeScript
		const tsCode = formatAsTypeScript(glyphs, characterWidth);

		// Add converter import at the top
		const fullCode = `import { asciiGlyphsToFont } from '../ascii-converter';\n\nconst glyphs = ${tsCode};\n\nexport default asciiGlyphsToFont(glyphs, ${characterWidth});`;

		console.log(fullCode);
	} catch (error) {
		console.error('Error converting font:', error);
		process.exit(1);
	}
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 3) {
	console.error('Usage: node convert-font-to-ascii.mjs <fontPath> <characterWidth> <characterHeight>');
	console.error('Example: node convert-font-to-ascii.mjs ./src/fonts/6x10/ascii.ts 6 10');
	process.exit(1);
}

const [fontPath, characterWidth, characterHeight] = args;
convertFont(fontPath, parseInt(characterWidth), parseInt(characterHeight));
