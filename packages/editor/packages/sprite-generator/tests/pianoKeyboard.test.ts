import { describe, it, expect } from 'vitest';

import { minimalColorScheme, characterDimensions8x16, characterDimensions6x10 } from './utils/testFixtures';
import {
	validateDrawingCommand,
	findCommand,
	findAllCommands,
	validateSpriteCoordinates,
	createMockBitmap,
} from './utils/testHelpers';

import generatePianoKeyboard, { PianoKey, generateLookup } from '../src/pianoKeyboard';
import { Command } from '../src/types';

describe('pianoKeyboard module', () => {
	describe('PianoKey enum', () => {
		it('should have correct piano key state values', () => {
			expect(PianoKey.NORMAL).toBe(1000);
			expect(PianoKey.PRESSED).toBe(2000);
			expect(PianoKey.HIGHLIGHTED).toBe(3000);
		});

		it('should have all required piano key states', () => {
			const pianoKeyKeys = Object.keys(PianoKey).filter(key => isNaN(Number(key)));
			expect(pianoKeyKeys).toContain('NORMAL');
			expect(pianoKeyKeys).toContain('PRESSED');
			expect(pianoKeyKeys).toContain('HIGHLIGHTED');
		});
	});

	describe('generatePianoKeyboard function', () => {
		const mockGlyphFont = createMockBitmap(256);
		const mockAsciiFont = createMockBitmap(256);

		it('should generate drawing commands for 8x16 characters', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have translate command to position offset
			const translateCommand = findCommand(commands, Command.TRANSLATE);
			expect(translateCommand).toBeDefined();
			validateDrawingCommand(translateCommand!, Command.TRANSLATE, [0, 200]);
		});

		it('should generate drawing commands for 6x10 characters', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions6x10.width,
				characterDimensions6x10.height,
				minimalColorScheme.icons
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have translate command
			const translateCommand = findCommand(commands, Command.TRANSLATE);
			expect(translateCommand).toBeDefined();
		});

		it('should generate keyboard background rectangle', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);

			// Should have piano keyboard background color
			const backgroundColorCommand = fillColorCommands.find(
				cmd => cmd[1] === minimalColorScheme.icons.pianoKeyboardBackground
			);
			expect(backgroundColorCommand).toBeDefined();

			// Should have background rectangle
			const backgroundRectangle = rectangleCommands.find(
				cmd => cmd[4] === 80 // height is fixed at 80
			);
			expect(backgroundRectangle).toBeDefined();
		});

		it('should generate piano key colors', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			// Should include piano key colors
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyboardBackground);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyboardNote);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyWhite);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyBlack);
		});

		it('should generate piano key colors for different states', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			// Should include pressed and highlighted colors
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyWhitePressed);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyWhiteHighlighted);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyBlackPressed);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyBlackHighlighted);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyboardNoteHighlighted);
		});

		it('should generate save and restore commands', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const saveCommands = findAllCommands(commands, Command.SAVE);
			const restoreCommands = findAllCommands(commands, Command.RESTORE);

			// Should have save and restore commands for state management
			expect(saveCommands.length).toBeGreaterThan(0);
			expect(restoreCommands.length).toBeGreaterThan(0);
		});

		it('should generate translate commands for positioning keys', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have initial positioning translate
			const initialTranslate = translateCommands[0];
			validateDrawingCommand(initialTranslate, Command.TRANSLATE, [0, 200]);

			// Should have multiple translate commands for positioning keyboard elements
			expect(translateCommands.length).toBeGreaterThan(10);
		});

		it('should generate pixel commands for character rendering', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			// Should generate commands even if pixel commands depend on font data
			// The function should include character rendering calls
			expect(commands.length).toBeGreaterThan(50); // Should have many commands
		});

		it('should handle different character dimensions correctly', () => {
			const commands8x16 = generatePianoKeyboard(mockGlyphFont, mockAsciiFont, 8, 16, minimalColorScheme.icons);
			const commands6x10 = generatePianoKeyboard(mockGlyphFont, mockAsciiFont, 6, 10, minimalColorScheme.icons);

			// Both should have same structure
			expect(commands8x16[0]).toEqual([Command.RESET_TRANSFORM]);
			expect(commands6x10[0]).toEqual([Command.RESET_TRANSFORM]);

			// Background rectangles should have different widths but same height
			const bg8x16 = findAllCommands(commands8x16, Command.RECTANGLE).find(cmd => cmd[4] === 80);
			const bg6x10 = findAllCommands(commands6x10, Command.RECTANGLE).find(cmd => cmd[4] === 80);

			expect(bg8x16).toBeDefined();
			expect(bg6x10).toBeDefined();
			expect(bg8x16![3]).not.toBe(bg6x10![3]); // Different widths
		});

		it('should generate keyboard with correct number of keys', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have translates for positioning keys
			// Each key group should have positioning translates
			const keyPositioningTranslates = translateCommands.filter(
				cmd => cmd[1] === characterDimensions8x16.height && cmd[2] === 0
			);
			expect(keyPositioningTranslates.length).toBeGreaterThan(10); // 12 keys per state * 3 states
		});

		it('should use correct colors from color scheme', () => {
			const commands = generatePianoKeyboard(
				mockGlyphFont,
				mockAsciiFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			// Verify all piano keyboard colors are used
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyboardBackground);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyboardNote);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyboardNoteHighlighted);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyWhite);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyWhitePressed);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyWhiteHighlighted);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyBlack);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyBlackPressed);
			expect(colorValues).toContain(minimalColorScheme.icons.pianoKeyBlackHighlighted);
		});
	});

	describe('generateLookup function', () => {
		it('should generate correct lookup for 8x16 characters', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			// Should have 24 entries (24 keys)
			expect(Object.keys(lookup)).toHaveLength(24);

			// Check specific entries exist
			expect(lookup[0]).toBeDefined();
			expect(lookup[1]).toBeDefined();
			expect(lookup[23]).toBeDefined();
		});

		it('should generate correct lookup for 6x10 characters', () => {
			const lookup = generateLookup(characterDimensions6x10.width, characterDimensions6x10.height);

			// Should have 24 entries (24 keys)
			expect(Object.keys(lookup)).toHaveLength(24);
		});

		it('should generate correct sprite coordinates for first key', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const firstKey = lookup[0];

			validateSpriteCoordinates(
				firstKey,
				0, // offsetX
				200, // offsetY
				characterDimensions8x16.width * 2, // spriteWidth (2 characters wide)
				characterDimensions8x16.height * 5 // spriteHeight (5 characters tall)
			);
		});

		it('should generate correct sprite coordinates with proper spacing', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const keyWidth = characterDimensions8x16.width * 2;

			// Check that keys are spaced correctly
			for (let i = 0; i < 24; i++) {
				const key = lookup[i];

				validateSpriteCoordinates(
					key,
					i * keyWidth, // x position increases by key width
					200, // offsetY (constant)
					keyWidth, // spriteWidth (2 characters)
					characterDimensions8x16.height * 5 // spriteHeight (5 characters)
				);
			}
		});

		it('should generate correct coordinates for 6x10 characters', () => {
			const lookup = generateLookup(characterDimensions6x10.width, characterDimensions6x10.height);

			const firstKey = lookup[0];

			validateSpriteCoordinates(
				firstKey,
				0, // offsetX
				200, // offsetY
				characterDimensions6x10.width * 2, // spriteWidth (2 characters wide)
				characterDimensions6x10.height * 5 // spriteHeight (5 characters tall)
			);
		});

		it('should generate coordinates with increasing x positions', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const coordinates = Object.values(lookup);
			const keyWidth = characterDimensions8x16.width * 2;

			// Check that x coordinates increase by key width
			for (let i = 1; i < coordinates.length; i++) {
				const prevCoordinate = coordinates[i - 1];
				const currentCoordinate = coordinates[i];

				expect(currentCoordinate.x).toBe(prevCoordinate.x + keyWidth);
				expect(currentCoordinate.y).toBe(prevCoordinate.y); // y should stay same
				expect(currentCoordinate.spriteWidth).toBe(prevCoordinate.spriteWidth);
				expect(currentCoordinate.spriteHeight).toBe(prevCoordinate.spriteHeight);
			}
		});

		it('should maintain consistent Y coordinates and dimensions', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const coordinates = Object.values(lookup);

			// All coordinates should have same Y, width, and height
			coordinates.forEach(coord => {
				expect(coord.y).toBe(200); // offsetY
				expect(coord.spriteWidth).toBe(characterDimensions8x16.width * 2);
				expect(coord.spriteHeight).toBe(characterDimensions8x16.height * 5);
			});
		});

		it('should generate sequential numeric keys from 0 to 23', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const keys = Object.keys(lookup)
				.map(Number)
				.sort((a, b) => a - b);
			const expectedKeys = Array.from({ length: 24 }, (_, i) => i);

			expect(keys).toEqual(expectedKeys);
		});

		it('should handle different character heights correctly', () => {
			const lookup8x16 = generateLookup(8, 16);
			const lookup6x10 = generateLookup(6, 10);

			const coord8x16 = lookup8x16[0];
			const coord6x10 = lookup6x10[0];

			// Should have same x, y but different width and height
			expect(coord8x16.x).toBe(coord6x10.x);
			expect(coord8x16.y).toBe(coord6x10.y);
			expect(coord8x16.spriteWidth).toBe(8 * 2);
			expect(coord8x16.spriteHeight).toBe(16 * 5);
			expect(coord6x10.spriteWidth).toBe(6 * 2);
			expect(coord6x10.spriteHeight).toBe(10 * 5);
		});
	});
});
