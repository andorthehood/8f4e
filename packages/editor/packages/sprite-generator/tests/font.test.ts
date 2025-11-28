import { describe, it, expect } from 'vitest';

import { minimalColorScheme, characterDimensions8x16, characterDimensions6x10 } from './utils/testFixtures';
import { findAllCommands, createMockBitmap } from './utils/testHelpers';

import generateFonts, { generateLookups, drawCharacter, drawCharacterMatrix } from '../src/font';
import { Command } from '../src/types';

describe('font module', () => {
	describe('drawCharacter function', () => {
		it('should generate pixel commands for character with set bits', () => {
			// Create a font with specific bit pattern
			const testFont = new Array(256 * 16).fill(0);
			// Set some bits for character 'A' (ASCII 65)
			testFont[65 * 16] = 0b11111111; // First row all set
			testFont[65 * 16 + 1] = 0b10000001; // Second row corners set

			const commands = drawCharacter(testFont, 65, 8, 16);
			const pixelCommands = findAllCommands(commands, Command.PIXEL);

			// Should generate pixel commands for set bits
			expect(pixelCommands.length).toBeGreaterThan(0);

			// First row should have 8 pixels
			const firstRowPixels = pixelCommands.filter(cmd => cmd[2] === 0);
			expect(firstRowPixels.length).toBe(8);

			// Second row should have 2 pixels (corners)
			const secondRowPixels = pixelCommands.filter(cmd => cmd[2] === 1);
			expect(secondRowPixels.length).toBe(2);
		});

		it('should handle string character codes', () => {
			const testFont = new Array(256 * 16).fill(0);
			testFont[65 * 16] = 0b11111111; // 'A'

			const commandsNumber = drawCharacter(testFont, 65, 8, 16);
			const commandsString = drawCharacter(testFont, 'A', 8, 16);

			// Should generate same commands for number and string
			expect(commandsNumber).toEqual(commandsString);
		});

		it('should generate correct pixel coordinates', () => {
			const testFont = new Array(256 * 16).fill(0);
			testFont[65 * 16] = 0b10000001; // First and last bit set

			const commands = drawCharacter(testFont, 65, 8, 16);
			const pixelCommands = findAllCommands(commands, Command.PIXEL);

			// Should have pixels at (0,0) and (7,0)
			expect(pixelCommands).toContainEqual([Command.PIXEL, 0, 0]);
			expect(pixelCommands).toContainEqual([Command.PIXEL, 7, 0]);
		});

		it('should handle different character dimensions', () => {
			const testFont = new Array(256 * 10).fill(0);
			testFont[65 * 10] = 0b111111; // First 6 bits set

			const commands = drawCharacter(testFont, 65, 6, 10);
			const pixelCommands = findAllCommands(commands, Command.PIXEL);

			// Should generate pixels for 6-bit width
			expect(pixelCommands.length).toBe(6);
			expect(pixelCommands).toContainEqual([Command.PIXEL, 0, 0]);
			expect(pixelCommands).toContainEqual([Command.PIXEL, 5, 0]);
		});

		it('should return empty array for character with no set bits', () => {
			const testFont = new Array(256 * 16).fill(0);
			// Character 65 has no bits set

			const commands = drawCharacter(testFont, 65, 8, 16);

			expect(commands).toEqual([]);
		});
	});

	describe('drawCharacterMatrix function', () => {
		const mockFont = createMockBitmap(256);

		it('should generate save and restore commands', () => {
			const commands = drawCharacterMatrix(mockFont, 8, 16, [[65], [66]]);

			expect(commands[0]).toEqual([Command.SAVE]);
			expect(commands[commands.length - 1]).toEqual([Command.RESTORE]);
		});

		it('should generate translate commands for positioning', () => {
			const commands = drawCharacterMatrix(mockFont, 8, 16, [
				[65, 66],
				[67, 68],
			]);
			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have translate commands for horizontal and vertical positioning
			expect(translateCommands.length).toBeGreaterThan(0);

			// Should have horizontal translates (characterWidth, 0)
			const horizontalTranslates = translateCommands.filter(cmd => cmd[1] === 8 && cmd[2] === 0);
			expect(horizontalTranslates.length).toBeGreaterThan(0);

			// Should have vertical translates with negative x and positive y
			const verticalTranslates = translateCommands.filter(cmd => cmd[1] < 0 && cmd[2] === 16);
			expect(verticalTranslates.length).toBeGreaterThan(0);
		});

		it('should handle 2x2 character matrix correctly', () => {
			const commands = drawCharacterMatrix(mockFont, 8, 16, [
				[65, 66],
				[67, 68],
			]);
			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have translates for each character position
			const horizontalTranslates = translateCommands.filter(cmd => cmd[1] === 8 && cmd[2] === 0);
			expect(horizontalTranslates.length).toBe(4); // 2 chars per row * 2 rows

			// Should have row reset translates
			const rowResets = translateCommands.filter(
				cmd => cmd[1] === -16 && cmd[2] === 16 // -2 * characterWidth, characterHeight
			);
			expect(rowResets.length).toBe(2); // 2 rows
		});

		it('should handle empty matrix', () => {
			const commands = drawCharacterMatrix(mockFont, 8, 16, []);

			expect(commands[0]).toEqual([Command.SAVE]);
			expect(commands[commands.length - 1]).toEqual([Command.RESTORE]);
			expect(commands.length).toBe(2); // Only save and restore
		});

		it('should handle single character matrix', () => {
			const commands = drawCharacterMatrix(mockFont, 8, 16, [[65]]);
			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have horizontal translate for the character
			const horizontalTranslates = translateCommands.filter(cmd => cmd[1] === 8 && cmd[2] === 0);
			expect(horizontalTranslates.length).toBe(1);
		});
	});

	describe('generateFonts function', () => {
		const mockFont = createMockBitmap(256);

		it('should generate drawing commands for 8x16 characters', () => {
			const commands = generateFonts(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.text
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have fill color commands for text colors
			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			expect(fillColorCommands.length).toBeGreaterThan(0);
		});

		it('should generate drawing commands for 6x10 characters', () => {
			const commands = generateFonts(
				mockFont,
				characterDimensions6x10.width,
				characterDimensions6x10.height,
				minimalColorScheme.text
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have fill color commands
			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			expect(fillColorCommands.length).toBeGreaterThan(0);
		});

		it('should generate fill color commands for all text colors', () => {
			const commands = generateFonts(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.text
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			// Should include all text colors from color scheme
			expect(colorValues).toContain(minimalColorScheme.text.lineNumber);
			expect(colorValues).toContain(minimalColorScheme.text.instruction);
			expect(colorValues).toContain(minimalColorScheme.text.code);
			expect(colorValues).toContain(minimalColorScheme.text.numbers);
			expect(colorValues).toContain(minimalColorScheme.text.menuItemText);
		});

		it('should generate translate commands for positioning fonts', () => {
			const commands = generateFonts(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.text
			);

			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have translate commands for positioning different font colors
			expect(translateCommands.length).toBeGreaterThan(0);
		});

		it('should handle different character dimensions correctly', () => {
			const commands8x16 = generateFonts(mockFont, 8, 16, minimalColorScheme.text);
			const commands6x10 = generateFonts(mockFont, 6, 10, minimalColorScheme.text);

			// Both should start with reset transform
			expect(commands8x16[0]).toEqual([Command.RESET_TRANSFORM]);
			expect(commands6x10[0]).toEqual([Command.RESET_TRANSFORM]);

			// Both should have fill color commands for all text colors
			const fillColors8x16 = findAllCommands(commands8x16, Command.FILL_COLOR);
			const fillColors6x10 = findAllCommands(commands6x10, Command.FILL_COLOR);

			expect(fillColors8x16.length).toBe(fillColors6x10.length);
		});

		it('should use correct colors from color scheme', () => {
			const commands = generateFonts(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.text
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			// Check all text colors are present
			Object.values(minimalColorScheme.text).forEach(color => {
				expect(colorValues).toContain(color);
			});
		});
	});

	describe('generateLookups function', () => {
		it('should generate correct lookups for 8x16 characters', () => {
			const lookups = generateLookups(characterDimensions8x16.width, characterDimensions8x16.height);

			// Should have font lookups for all text color types
			expect(lookups.fontLineNumber).toBeDefined();
			expect(lookups.fontInstruction).toBeDefined();
			expect(lookups.fontCode).toBeDefined();
			expect(lookups.fontNumbers).toBeDefined();
			expect(lookups.fontMenuItemText).toBeDefined();
			expect(lookups.fontMenuItemTextHighlighted).toBeDefined();
			expect(lookups.fontDialogText).toBeDefined();
			expect(lookups.fontDialogTitle).toBeDefined();
			expect(lookups.fontBinaryZero).toBeDefined();
			expect(lookups.fontBinaryOne).toBeDefined();
			expect(lookups.fontCodeComment).toBeDefined();
		});

		it('should generate correct lookups for 6x10 characters', () => {
			const lookups = generateLookups(characterDimensions6x10.width, characterDimensions6x10.height);

			// Should have same font lookup types
			expect(lookups.fontLineNumber).toBeDefined();
			expect(lookups.fontInstruction).toBeDefined();
			expect(lookups.fontCode).toBeDefined();
		});

		it('should generate correct sprite coordinates for ASCII characters', () => {
			const lookups = generateLookups(characterDimensions8x16.width, characterDimensions8x16.height);

			// Check character 'A' (ASCII 65) in first font
			const charA = lookups.fontLineNumber[65];
			expect(charA).toBeDefined();
			expect(charA.x).toBe(65 * characterDimensions8x16.width); // 65 * characterWidth
			expect(charA.spriteWidth).toBe(characterDimensions8x16.width);
			expect(charA.spriteHeight).toBe(characterDimensions8x16.height);

			// Check character 'B' (ASCII 66)
			const charB = lookups.fontLineNumber[66];
			expect(charB).toBeDefined();
			expect(charB.x).toBe(66 * characterDimensions8x16.width);
		});

		it('should generate correct sprite coordinates for string characters', () => {
			const lookups = generateLookups(characterDimensions8x16.width, characterDimensions8x16.height);

			// Check character 'A' by string and by ASCII code
			const charAByString = lookups.fontLineNumber['A'];
			const charAByCode = lookups.fontLineNumber[65];

			expect(charAByString).toBeDefined();
			expect(charAByCode).toBeDefined();
			expect(charAByString).toEqual(charAByCode);
		});

		it('should generate lookups with different Y positions for different font types', () => {
			const lookups = generateLookups(characterDimensions8x16.width, characterDimensions8x16.height);

			// Different font types should have different Y positions
			const charALineNumber = lookups.fontLineNumber['A'];
			const charAInstruction = lookups.fontInstruction['A'];
			const charACode = lookups.fontCode['A'];

			expect(charALineNumber.y).not.toBe(charAInstruction.y);
			expect(charAInstruction.y).not.toBe(charACode.y);

			// But same X positions and dimensions
			expect(charALineNumber.x).toBe(charAInstruction.x);
			expect(charAInstruction.x).toBe(charACode.x);
			expect(charALineNumber.spriteWidth).toBe(charAInstruction.spriteWidth);
			expect(charALineNumber.spriteHeight).toBe(charAInstruction.spriteHeight);
		});

		it('should handle all ASCII characters', () => {
			const lookups = generateLookups(characterDimensions8x16.width, characterDimensions8x16.height);

			// Check space character (ASCII 32)
			expect(lookups.fontCode[32]).toBeDefined();
			expect(lookups.fontCode[' ']).toBeDefined();
			expect(lookups.fontCode[32]).toEqual(lookups.fontCode[' ']);

			// Check special characters
			expect(lookups.fontCode['!']).toBeDefined();
			expect(lookups.fontCode['@']).toBeDefined();
			expect(lookups.fontCode['~']).toBeDefined();
		});

		it('should generate coordinates with correct character spacing', () => {
			const lookups = generateLookups(characterDimensions8x16.width, characterDimensions8x16.height);

			// Check that characters are spaced by character width
			const charA = lookups.fontCode['A']; // ASCII 65
			const charB = lookups.fontCode['B']; // ASCII 66
			const charC = lookups.fontCode['C']; // ASCII 67

			expect(charB.x).toBe(charA.x + characterDimensions8x16.width);
			expect(charC.x).toBe(charB.x + characterDimensions8x16.width);
		});
	});
});
