import { describe, it, expect } from 'vitest';

import { minimalColorScheme, characterDimensions8x16, characterDimensions6x10 } from './utils/testFixtures';
import {
	validateDrawingCommand,
	findCommand,
	findAllCommands,
	validateSpriteCoordinates,
	createMockBitmap,
} from './utils/testHelpers';

import generateIcons, { Icon, generateLookup } from '../src/icons';
import { Command } from '../src/types';

describe('icons module', () => {
	describe('Icon enum', () => {
		it('should have all required icon types', () => {
			expect(Icon.INPUT).toBe(0);
			expect(Icon.SWITCH_OFF).toBe(1);
			expect(Icon.SWITCH_ON).toBe(2);
			expect(Icon.ARROW_TOP).toBe(3);
			expect(Icon.ARROW_RIGHT).toBe(4);
			expect(Icon.ARROW_BOTTOM).toBe(5);
			expect(Icon.ARROW_LEFT).toBe(6);
		});

		it('should have correct number of icon types', () => {
			const iconKeys = Object.keys(Icon).filter(key => isNaN(Number(key)));
			expect(iconKeys.length).toBe(7);
		});
	});

	describe('generateIcons function', () => {
		const mockFont = createMockBitmap(256);

		it('should generate drawing commands for 8x16 characters', () => {
			const commands = generateIcons(
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
			validateDrawingCommand(translateCommand!, Command.TRANSLATE, [0, 150]);
		});

		it('should generate drawing commands for 6x10 characters', () => {
			const commands = generateIcons(
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

		it('should generate fill color commands for icon backgrounds', () => {
			const commands = generateIcons(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);

			// Should include background colors for connectors and switches
			const colorValues = fillColorCommands.map(cmd => cmd[1]);
			expect(colorValues).toContain(minimalColorScheme.icons.inputConnectorBackground);
			expect(colorValues).toContain(minimalColorScheme.icons.switchBackground);
			expect(colorValues).toContain(minimalColorScheme.icons.inputConnector);
		});

		it('should generate rectangle commands for icon backgrounds', () => {
			const commands = generateIcons(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);

			// Should have rectangles for backgrounds
			expect(rectangleCommands.length).toBeGreaterThan(0);

			// Check that some rectangles are for multi-character icons
			const wideRectangles = rectangleCommands.filter(
				cmd =>
					cmd[3] === characterDimensions8x16.width * 3 || // INPUT icon width
					cmd[3] === characterDimensions8x16.width * 4 // SWITCH icon width
			);
			expect(wideRectangles.length).toBeGreaterThan(0);
		});

		it('should generate translate commands for character positioning', () => {
			const commands = generateIcons(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			const translateCommands = findAllCommands(commands, Command.TRANSLATE);

			// Should have multiple translate commands for positioning characters
			expect(translateCommands.length).toBeGreaterThan(1);

			// Some translates should move by character width
			const characterWidthTranslates = translateCommands.filter(
				cmd => cmd[1] === characterDimensions8x16.width && cmd[2] === 0
			);
			expect(characterWidthTranslates.length).toBeGreaterThan(0);
		});

		it('should handle different character dimensions correctly', () => {
			const commands8x16 = generateIcons(mockFont, 8, 16, minimalColorScheme.icons);
			const commands6x10 = generateIcons(mockFont, 6, 10, minimalColorScheme.icons);

			// Both should start with same structure
			expect(commands8x16[0]).toEqual([Command.RESET_TRANSFORM]);
			expect(commands6x10[0]).toEqual([Command.RESET_TRANSFORM]);

			const rectangles8x16 = findAllCommands(commands8x16, Command.RECTANGLE);
			const rectangles6x10 = findAllCommands(commands6x10, Command.RECTANGLE);

			// Should have same number of rectangles but different dimensions
			expect(rectangles8x16.length).toBe(rectangles6x10.length);

			// Check that rectangle heights are different
			const rect8x16 = rectangles8x16.find(cmd => cmd[4] === 16);
			const rect6x10 = rectangles6x10.find(cmd => cmd[4] === 10);
			expect(rect8x16).toBeDefined();
			expect(rect6x10).toBeDefined();
		});

		it('should handle missing colors gracefully', () => {
			const colorsWithUndefined = {
				...minimalColorScheme.icons,
				inputConnectorBackground: undefined as string | undefined,
				arrow: undefined as string | undefined,
			};

			expect(() => {
				generateIcons(mockFont, characterDimensions8x16.width, characterDimensions8x16.height, colorsWithUndefined);
			}).not.toThrow();
		});

		it('should generate pixel commands for character rendering', () => {
			const commands = generateIcons(
				mockFont,
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.icons
			);

			// Should generate commands even if pixel commands depend on font data
			// The function should include drawCharacter calls which may generate pixels
			expect(commands.length).toBeGreaterThan(20); // Should have many commands
		});
	});

	describe('generateLookup function', () => {
		it('should generate correct lookup for 8x16 characters', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			// Should have entries for all icon types
			expect(Object.keys(lookup)).toHaveLength(7);
			expect(lookup[Icon.INPUT]).toBeDefined();
			expect(lookup[Icon.SWITCH_OFF]).toBeDefined();
			expect(lookup[Icon.SWITCH_ON]).toBeDefined();
			expect(lookup[Icon.ARROW_TOP]).toBeDefined();
			expect(lookup[Icon.ARROW_RIGHT]).toBeDefined();
			expect(lookup[Icon.ARROW_BOTTOM]).toBeDefined();
			expect(lookup[Icon.ARROW_LEFT]).toBeDefined();
		});

		it('should generate correct sprite coordinates for INPUT icon', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const inputCoordinate = lookup[Icon.INPUT];

			validateSpriteCoordinates(
				inputCoordinate,
				0, // offsetX for first icon
				150, // offsetY
				characterDimensions8x16.width * 3, // INPUT icon spans 3 characters
				characterDimensions8x16.height
			);
		});

		it('should generate correct sprite coordinates for SWITCH icons', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const switchOffCoordinate = lookup[Icon.SWITCH_OFF];
			const switchOnCoordinate = lookup[Icon.SWITCH_ON];

			// Both switch icons should span 4 characters
			expect(switchOffCoordinate.spriteWidth).toBe(characterDimensions8x16.width * 4);
			expect(switchOnCoordinate.spriteWidth).toBe(characterDimensions8x16.width * 4);

			// Switch ON should be positioned after Switch OFF
			expect(switchOnCoordinate.x).toBeGreaterThan(switchOffCoordinate.x);
		});

		it('should generate correct sprite coordinates for arrow icons', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const arrowTopCoordinate = lookup[Icon.ARROW_TOP];
			const arrowRightCoordinate = lookup[Icon.ARROW_RIGHT];
			const arrowBottomCoordinate = lookup[Icon.ARROW_BOTTOM];
			const arrowLeftCoordinate = lookup[Icon.ARROW_LEFT];

			// All arrow icons should span 1 character
			expect(arrowTopCoordinate.spriteWidth).toBe(characterDimensions8x16.width);
			expect(arrowRightCoordinate.spriteWidth).toBe(characterDimensions8x16.width);
			expect(arrowBottomCoordinate.spriteWidth).toBe(characterDimensions8x16.width);
			expect(arrowLeftCoordinate.spriteWidth).toBe(characterDimensions8x16.width);

			// Arrows should be positioned after switches
			expect(arrowTopCoordinate.x).toBeGreaterThan(0);
			expect(arrowRightCoordinate.x).toBeGreaterThan(arrowTopCoordinate.x);
			expect(arrowBottomCoordinate.x).toBeGreaterThan(arrowRightCoordinate.x);
			expect(arrowLeftCoordinate.x).toBeGreaterThan(arrowBottomCoordinate.x);
		});

		it('should generate correct coordinates for 6x10 characters', () => {
			const lookup = generateLookup(characterDimensions6x10.width, characterDimensions6x10.height);

			const inputCoordinate = lookup[Icon.INPUT];
			const arrowCoordinate = lookup[Icon.ARROW_TOP];

			// Should have correct dimensions for 6x10
			expect(inputCoordinate.spriteHeight).toBe(characterDimensions6x10.height);
			expect(inputCoordinate.spriteWidth).toBe(characterDimensions6x10.width * 3);
			expect(arrowCoordinate.spriteHeight).toBe(characterDimensions6x10.height);
			expect(arrowCoordinate.spriteWidth).toBe(characterDimensions6x10.width);
		});

		it('should maintain consistent Y coordinates for all icons', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const coordinates = Object.values(lookup);
			const yValues = coordinates.map(coord => coord.y);

			// All icons should be on the same row
			expect(new Set(yValues).size).toBe(1);
			expect(yValues[0]).toBe(150); // offsetY
		});

		it('should have non-overlapping X coordinates', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const coordinates = Object.values(lookup);

			// Sort by x coordinate to check for overlaps
			const sortedCoords = coordinates.sort((a, b) => a.x - b.x);

			for (let i = 1; i < sortedCoords.length; i++) {
				const prev = sortedCoords[i - 1];
				const current = sortedCoords[i];

				// Current icon should start after previous icon ends
				expect(current.x).toBeGreaterThanOrEqual(prev.x + prev.spriteWidth);
			}
		});
	});
});
