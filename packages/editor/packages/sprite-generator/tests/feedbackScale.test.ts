import { describe, it, expect } from 'vitest';

import { minimalColorScheme, characterDimensions8x16, characterDimensions6x10 } from './utils/testFixtures';
import {
	validateDrawingCommand,
	findCommand,
	findAllCommands,
	validateSpriteCoordinates,
	createMockBitmap,
} from './utils/testHelpers';

import generateFeedbackScale, { generateLookup } from '../src/feedbackScale';
import { Command } from '../src/types';

describe('feedbackScale module', () => {
	describe('generateFeedbackScale function', () => {
		const mockFont = createMockBitmap(256);

		it('should generate drawing commands for 8x16 characters', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have translate command to position offset
			const translateCommand = findCommand(commands, Command.TRANSLATE);
			expect(translateCommand).toBeDefined();
			validateDrawingCommand(translateCommand!, Command.TRANSLATE, [0, 130]);
		});

		it('should generate drawing commands for 6x10 characters', () => {
			const commands = generateFeedbackScale(
				mockFont,
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

		it('should generate commands for each feedback scale color', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const feedbackScaleLength = minimalColorScheme.icons.feedbackScale.length;

			// Should have rectangles for each feedback scale item (background rectangles)
			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);
			const backgroundRectangles = rectangleCommands.filter(
				cmd => cmd[3] === characterDimensions8x16.width * 3 && cmd[4] === characterDimensions8x16.height
			);
			expect(backgroundRectangles.length).toBe(feedbackScaleLength);
		});

		it('should generate correct background rectangles for feedback scale items', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);
			const backgroundRectangles = rectangleCommands.filter(
				cmd => cmd[3] === characterDimensions8x16.width * 3 && cmd[4] === characterDimensions8x16.height
			);

			// Each background rectangle should have correct dimensions
			backgroundRectangles.forEach(cmd => {
				validateDrawingCommand(cmd, Command.RECTANGLE);
				expect(cmd[1]).toBe(0); // x
				expect(cmd[2]).toBe(0); // y
				expect(cmd[3]).toBe(characterDimensions8x16.width * 3); // width (3 characters)
				expect(cmd[4]).toBe(characterDimensions8x16.height); // height
			});
		});

		it('should generate fill color commands for backgrounds and connectors', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			// Should include background and connector colors
			expect(colorValues).toContain(minimalColorScheme.icons.outputConnectorBackground);
			expect(colorValues).toContain(minimalColorScheme.icons.outputConnector);

			// Should include feedback scale colors
			minimalColorScheme.icons.feedbackScale.forEach(color => {
				expect(colorValues).toContain(color);
			});
		});

		it('should generate correct number of feedback scale color commands', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const feedbackScaleLength = minimalColorScheme.icons.feedbackScale.length;

			// Each feedback scale item has multiple fill color commands
			const feedbackScaleColorCommands = fillColorCommands.filter(cmd =>
				minimalColorScheme.icons.feedbackScale.includes(cmd[1] as string)
			);
			expect(feedbackScaleColorCommands.length).toBe(feedbackScaleLength);
		});

		it('should generate translate commands for positioning', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have initial positioning translate
			const initialTranslate = translateCommands[0];
			validateDrawingCommand(initialTranslate, Command.TRANSLATE, [0, 130]);

			// Should have character positioning translates
			const characterTranslates = translateCommands.filter(
				cmd => cmd[1] === characterDimensions8x16.width && cmd[2] === 0
			);
			expect(characterTranslates.length).toBeGreaterThan(0);
		});

		it('should generate pixel commands for character rendering', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			// Should generate commands even if pixel commands depend on font data
			// The function should attempt to render characters even with mock font
			expect(commands.length).toBeGreaterThan(10); // Should have many commands
		});

		it('should handle different character dimensions correctly', () => {
			const commands8x16 = generateFeedbackScale(mockFont, 8, 16, minimalColorScheme.icons);
			const commands6x10 = generateFeedbackScale(mockFont, 6, 10, minimalColorScheme.icons);

			// Both should have same structure
			expect(commands8x16[0]).toEqual([Command.RESET_TRANSFORM]);
			expect(commands6x10[0]).toEqual([Command.RESET_TRANSFORM]);

			// Background rectangles should have different dimensions
			const bg8x16 = findAllCommands(commands8x16, Command.RECTANGLE).filter(cmd => cmd[3] === 8 * 3 && cmd[4] === 16);
			const bg6x10 = findAllCommands(commands6x10, Command.RECTANGLE).filter(cmd => cmd[3] === 6 * 3 && cmd[4] === 10);

			expect(bg8x16.length).toBeGreaterThan(0);
			expect(bg6x10.length).toBeGreaterThan(0);
			expect(bg8x16.length).toBe(bg6x10.length); // Same number of feedback scale items
		});

		it('should handle empty feedback scale array', () => {
			const emptyColorsScheme = {
				...minimalColorScheme.icons,
				feedbackScale: [],
			};

			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				emptyColorsScheme
			);

			// Should still have basic structure
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);
			expect(commands[1]).toEqual([Command.TRANSLATE, 0, 130]);

			// Should not have any feedback scale specific rectangles
			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);
			expect(rectangleCommands.length).toBe(0);
		});

		it('should use correct colors from color scheme', () => {
			const commands = generateFeedbackScale(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			expect(colorValues).toContain(minimalColorScheme.icons.outputConnectorBackground);
			expect(colorValues).toContain(minimalColorScheme.icons.outputConnector);
			minimalColorScheme.icons.feedbackScale.forEach(color => {
				expect(colorValues).toContain(color);
			});
		});
	});

	describe('generateLookup function', () => {
		it('should generate correct lookup for 8x16 characters', () => {
			const lookup = generateLookup(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons.feedbackScale
			);

			const feedbackScaleLength = minimalColorScheme.icons.feedbackScale.length;

			// Should have entries for all feedback scale colors
			expect(Object.keys(lookup)).toHaveLength(feedbackScaleLength);

			// Check specific entries exist
			for (let i = 0; i < feedbackScaleLength; i++) {
				expect(lookup[i]).toBeDefined();
			}
		});

		it('should generate correct lookup for 6x10 characters', () => {
			const lookup = generateLookup(
				characterDimensions6x10.width,
				characterDimensions6x10.height,
				minimalColorScheme.icons.feedbackScale
			);

			const feedbackScaleLength = minimalColorScheme.icons.feedbackScale.length;

			// Should have entries for all feedback scale colors
			expect(Object.keys(lookup)).toHaveLength(feedbackScaleLength);
		});

		it('should generate correct sprite coordinates for first item', () => {
			const lookup = generateLookup(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons.feedbackScale
			);

			const firstItem = lookup[0];

			validateSpriteCoordinates(
				firstItem,
				0, // offsetX
				130, // offsetY
				characterDimensions8x16.width * 3, // spriteWidth (3 characters)
				characterDimensions8x16.height // spriteHeight
			);
		});

		it('should generate correct sprite coordinates with proper spacing', () => {
			const lookup = generateLookup(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons.feedbackScale
			);

			const itemWidth = characterDimensions8x16.width * 3;

			// Check that items are spaced correctly
			for (let i = 0; i < Object.keys(lookup).length; i++) {
				const item = lookup[i];

				validateSpriteCoordinates(
					item,
					i * itemWidth, // x position increases by item width
					130, // offsetY (constant)
					itemWidth, // spriteWidth (3 characters)
					characterDimensions8x16.height // spriteHeight
				);
			}
		});

		it('should generate correct coordinates for 6x10 characters', () => {
			const lookup = generateLookup(
				characterDimensions6x10.width,
				characterDimensions6x10.height,
				minimalColorScheme.icons.feedbackScale
			);

			const firstItem = lookup[0];

			validateSpriteCoordinates(
				firstItem,
				0, // offsetX
				130, // offsetY
				characterDimensions6x10.width * 3, // spriteWidth (3 characters)
				characterDimensions6x10.height // spriteHeight
			);
		});

		it('should handle empty feedback scale array', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height, []);

			// Should have no entries
			expect(Object.keys(lookup)).toHaveLength(0);
		});

		it('should generate coordinates with increasing x positions', () => {
			const lookup = generateLookup(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons.feedbackScale
			);

			const coordinates = Object.values(lookup);
			const itemWidth = characterDimensions8x16.width * 3;

			// Check that x coordinates increase by item width
			for (let i = 1; i < coordinates.length; i++) {
				const prevCoordinate = coordinates[i - 1];
				const currentCoordinate = coordinates[i];

				expect(currentCoordinate.x).toBe(prevCoordinate.x + itemWidth);
				expect(currentCoordinate.y).toBe(prevCoordinate.y); // y should stay same
				expect(currentCoordinate.spriteWidth).toBe(prevCoordinate.spriteWidth);
				expect(currentCoordinate.spriteHeight).toBe(prevCoordinate.spriteHeight);
			}
		});

		it('should maintain consistent Y coordinates and dimensions', () => {
			const lookup = generateLookup(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons.feedbackScale
			);

			const coordinates = Object.values(lookup);

			// All coordinates should have same Y, width, and height
			coordinates.forEach(coord => {
				expect(coord.y).toBe(130); // offsetY
				expect(coord.spriteWidth).toBe(characterDimensions8x16.width * 3);
				expect(coord.spriteHeight).toBe(characterDimensions8x16.height);
			});
		});

		it('should generate sequential numeric keys', () => {
			const lookup = generateLookup(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons.feedbackScale
			);

			const keys = Object.keys(lookup)
				.map(Number)
				.sort((a, b) => a - b);
			const expectedKeys = Array.from({ length: minimalColorScheme.icons.feedbackScale.length }, (_, i) => i);

			expect(keys).toEqual(expectedKeys);
		});
	});
});
