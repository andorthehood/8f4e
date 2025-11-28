import { describe, it, expect } from 'vitest';

import { minimalColorScheme, characterDimensions8x16, characterDimensions6x10 } from './utils/testFixtures';
import { validateDrawingCommand, findCommand, findAllCommands, validateSpriteCoordinates } from './utils/testHelpers';

import generateFillColors, { generateLookup } from '../src/fillColors';
import { Command } from '../src/types';

describe('fillColors module', () => {
	describe('generateFillColors function', () => {
		it('should generate drawing commands for 8x16 characters', () => {
			const commands = generateFillColors(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have translate command to position offset
			const translateCommand = findCommand(commands, Command.TRANSLATE);
			expect(translateCommand).toBeDefined();
			validateDrawingCommand(translateCommand!, Command.TRANSLATE, [0, 180]);
		});

		it('should generate drawing commands for 6x10 characters', () => {
			const commands = generateFillColors(
				characterDimensions6x10.width,
				characterDimensions6x10.height,
				minimalColorScheme.fill
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have translate command
			const translateCommand = findCommand(commands, Command.TRANSLATE);
			expect(translateCommand).toBeDefined();
		});

		it('should generate correct number of fill color commands', () => {
			const commands = generateFillColors(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);

			// Should have equal number of fill color and rectangle commands
			expect(fillColorCommands.length).toBe(rectangleCommands.length);
			expect(fillColorCommands.length).toBeGreaterThan(0);
		});

		it('should include all required color fill commands', () => {
			const commands = generateFillColors(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			// Check that specific colors from our color scheme are included
			expect(colorValues).toContain(minimalColorScheme.fill.background);
			expect(colorValues).toContain(minimalColorScheme.fill.menuItemBackground);
			expect(colorValues).toContain(minimalColorScheme.fill.wire);
		});

		it('should generate rectangle commands with correct dimensions', () => {
			const width = characterDimensions8x16.width;
			const height = characterDimensions8x16.height;
			const commands = generateFillColors(width, height, minimalColorScheme.fill);

			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);

			// Each rectangle should have correct dimensions
			rectangleCommands.forEach(cmd => {
				validateDrawingCommand(cmd, Command.RECTANGLE);
				expect(cmd[3]).toBe(width); // width parameter
				expect(cmd[4]).toBe(height); // height parameter
			});
		});

		it('should generate translate commands for positioning', () => {
			const width = characterDimensions8x16.width;
			const height = characterDimensions8x16.height;
			const commands = generateFillColors(width, height, minimalColorScheme.fill);

			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have initial positioning translate and positioning translates between rectangles
			expect(translateCommands.length).toBeGreaterThan(1);

			// Some translate commands should move by character width
			const characterWidthTranslates = translateCommands.filter(cmd => cmd[1] === width && cmd[2] === 0);
			expect(characterWidthTranslates.length).toBeGreaterThan(0);
		});

		it('should handle different character dimensions correctly', () => {
			const commands8x16 = generateFillColors(8, 16, minimalColorScheme.fill);
			const commands6x10 = generateFillColors(6, 10, minimalColorScheme.fill);

			// Both should have same structure but different dimensions
			expect(commands8x16.length).toBe(commands6x10.length);

			const rectangles8x16 = findAllCommands(commands8x16, Command.RECTANGLE);
			const rectangles6x10 = findAllCommands(commands6x10, Command.RECTANGLE);

			expect(rectangles8x16.length).toBe(rectangles6x10.length);

			// Check dimensions are different
			expect(rectangles8x16[0][3]).toBe(8); // width
			expect(rectangles8x16[0][4]).toBe(16); // height
			expect(rectangles6x10[0][3]).toBe(6); // width
			expect(rectangles6x10[0][4]).toBe(10); // height
		});
	});

	describe('generateLookup function', () => {
		it('should generate correct lookup for 8x16 characters', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			// Should have entries for all fill colors
			expect(Object.keys(lookup)).toContain('background');
			expect(Object.keys(lookup)).toContain('menuItemBackground');
			expect(Object.keys(lookup)).toContain('wire');
			expect(Object.keys(lookup)).toContain('errorMessageBackground');
		});

		it('should generate correct sprite coordinates for first color', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			// First color should be at offset position
			const firstColorKey = Object.keys(lookup)[0];
			const firstCoordinate = lookup[firstColorKey as keyof typeof lookup];

			validateSpriteCoordinates(
				firstCoordinate,
				0, // offsetX
				180, // offsetY
				characterDimensions8x16.width,
				characterDimensions8x16.height
			);
		});

		it('should generate correct sprite coordinates with proper spacing', () => {
			const width = characterDimensions8x16.width;
			const height = characterDimensions8x16.height;
			const lookup = generateLookup(width, height);

			const keys = Object.keys(lookup);
			if (keys.length >= 2) {
				const firstCoordinate = lookup[keys[0] as keyof typeof lookup];
				const secondCoordinate = lookup[keys[1] as keyof typeof lookup];

				// Second color should be offset by character width
				validateSpriteCoordinates(secondCoordinate, width, 180, width, height);
				expect(secondCoordinate.x).toBe(firstCoordinate.x + width);
			}
		});

		it('should generate correct coordinates for 6x10 characters', () => {
			const lookup = generateLookup(characterDimensions6x10.width, characterDimensions6x10.height);

			const keys = Object.keys(lookup);
			if (keys.length > 0) {
				const firstCoordinate = lookup[keys[0] as keyof typeof lookup];

				validateSpriteCoordinates(
					firstCoordinate,
					0,
					180,
					characterDimensions6x10.width,
					characterDimensions6x10.height
				);
			}
		});

		it('should generate lookup with all expected fill color keys', () => {
			const lookup = generateLookup(8, 16);
			const keys = Object.keys(lookup);

			// Should include key fill colors from the fillColors array
			expect(keys).toContain('menuItemBackground');
			expect(keys).toContain('menuItemBackgroundHighlighted');
			expect(keys).toContain('background');
			expect(keys).toContain('wire');
			expect(keys).toContain('errorMessageBackground');
		});

		it('should generate coordinates with increasing x positions', () => {
			const width = 8;
			const lookup = generateLookup(width, 16);
			const keys = Object.keys(lookup);

			// Check that x coordinates increase by character width
			for (let i = 1; i < keys.length; i++) {
				const prevCoordinate = lookup[keys[i - 1] as keyof typeof lookup];
				const currentCoordinate = lookup[keys[i] as keyof typeof lookup];

				expect(currentCoordinate.x).toBe(prevCoordinate.x + width);
				expect(currentCoordinate.y).toBe(prevCoordinate.y); // y should stay same
			}
		});
	});
});
