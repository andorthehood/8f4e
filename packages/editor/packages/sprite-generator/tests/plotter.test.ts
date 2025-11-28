import { describe, it, expect } from 'vitest';

import { minimalColorScheme, characterDimensions8x16, characterDimensions6x10 } from './utils/testFixtures';
import { validateDrawingCommand, findCommand, findAllCommands, validateSpriteCoordinates } from './utils/testHelpers';

import generatePlotter, { generateLookup } from '../src/plotter';
import { Command } from '../src/types';

describe('plotter module', () => {
	describe('generatePlotter function', () => {
		it('should generate drawing commands for 8x16 characters', () => {
			const commands = generatePlotter(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			// Should start with reset transform
			expect(commands[0]).toEqual([Command.RESET_TRANSFORM]);

			// Should have translate command to position offset
			const translateCommand = findCommand(commands, Command.TRANSLATE);
			expect(translateCommand).toBeDefined();
			validateDrawingCommand(translateCommand!, Command.TRANSLATE, [600, 300]);
		});

		it('should generate drawing commands for 6x10 characters', () => {
			const commands = generatePlotter(
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

		it('should generate background rectangle', () => {
			const commands = generatePlotter(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);

			// Should have plotter background color
			const backgroundColorCommand = fillColorCommands.find(
				cmd => cmd[1] === minimalColorScheme.fill.plotterBackground
			);
			expect(backgroundColorCommand).toBeDefined();

			// Should have background rectangle
			const backgroundRectangle = rectangleCommands.find(
				cmd => cmd[3] === 200 && cmd[4] === 200 // 200x200 background
			);
			expect(backgroundRectangle).toBeDefined();
			validateDrawingCommand(backgroundRectangle!, Command.RECTANGLE, [0, 0, 200, 200]);
		});

		it('should generate trace color and trace rectangles', () => {
			const commands = generatePlotter(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);

			// Should have plotter trace color
			const traceColorCommand = fillColorCommands.find(cmd => cmd[1] === minimalColorScheme.fill.plotterTrace);
			expect(traceColorCommand).toBeDefined();

			// Should have many trace rectangles (1x1 pixels)
			const traceRectangles = rectangleCommands.filter(
				cmd => cmd[3] === 1 && cmd[4] === 1 // 1x1 trace pixels
			);
			expect(traceRectangles.length).toBeGreaterThan(0);
		});

		it('should generate correct number of trace points for 8x16 characters', () => {
			const commands = generatePlotter(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);
			const traceRectangles = rectangleCommands.filter(
				cmd => cmd[3] === 1 && cmd[4] === 1 // 1x1 trace pixels
			);

			// Should have characterHeight * 8 trace points
			const expectedTracePoints = characterDimensions8x16.height * 8;
			expect(traceRectangles.length).toBe(expectedTracePoints);
		});

		it('should generate correct number of trace points for 6x10 characters', () => {
			const commands = generatePlotter(
				characterDimensions6x10.width,
				characterDimensions6x10.height,
				minimalColorScheme.fill
			);

			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);
			const traceRectangles = rectangleCommands.filter(
				cmd => cmd[3] === 1 && cmd[4] === 1 // 1x1 trace pixels
			);

			// Should have characterHeight * 8 trace points
			const expectedTracePoints = characterDimensions6x10.height * 8;
			expect(traceRectangles.length).toBe(expectedTracePoints);
		});

		it('should generate trace points with correct positions', () => {
			const commands = generatePlotter(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			const rectangleCommands = findAllCommands(commands, Command.RECTANGLE);
			const traceRectangles = rectangleCommands.filter(
				cmd => cmd[3] === 1 && cmd[4] === 1 // 1x1 trace pixels
			);

			// Check first few trace points have expected pattern
			const maxValue = characterDimensions8x16.height * 8;

			// First trace point should be at (0, maxValue)
			const firstTrace = traceRectangles[0];
			validateDrawingCommand(firstTrace, Command.RECTANGLE, [0, maxValue - 0, 1, 1]);

			// Second trace point should be at (1, maxValue - 1)
			const secondTrace = traceRectangles[1];
			validateDrawingCommand(secondTrace, Command.RECTANGLE, [1, maxValue - 1, 1, 1]);

			// Check that x coordinates increase
			for (let i = 1; i < Math.min(traceRectangles.length, 10); i++) {
				expect(traceRectangles[i][1]).toBe(i); // x coordinate
				expect(traceRectangles[i][2]).toBe(maxValue - i); // y coordinate
			}
		});

		it('should handle different character dimensions correctly', () => {
			const commands8x16 = generatePlotter(8, 16, minimalColorScheme.fill);
			const commands6x10 = generatePlotter(6, 10, minimalColorScheme.fill);

			// Both should have same background structure
			const bg8x16 = findAllCommands(commands8x16, Command.RECTANGLE).find(cmd => cmd[3] === 200 && cmd[4] === 200);
			const bg6x10 = findAllCommands(commands6x10, Command.RECTANGLE).find(cmd => cmd[3] === 200 && cmd[4] === 200);

			expect(bg8x16).toBeDefined();
			expect(bg6x10).toBeDefined();

			// But different number of trace points
			const trace8x16 = findAllCommands(commands8x16, Command.RECTANGLE).filter(cmd => cmd[3] === 1 && cmd[4] === 1);
			const trace6x10 = findAllCommands(commands6x10, Command.RECTANGLE).filter(cmd => cmd[3] === 1 && cmd[4] === 1);

			expect(trace8x16.length).toBe(16 * 8);
			expect(trace6x10.length).toBe(10 * 8);
		});

		it('should use correct colors from color scheme', () => {
			const commands = generatePlotter(
				characterDimensions8x16.width,
				characterDimensions8x16.height,
				minimalColorScheme.fill
			);

			const fillColorCommands = findAllCommands(commands, Command.FILL_COLOR);
			const colorValues = fillColorCommands.map(cmd => cmd[1]);

			expect(colorValues).toContain(minimalColorScheme.fill.plotterBackground);
			expect(colorValues).toContain(minimalColorScheme.fill.plotterTrace);
		});
	});

	describe('generateLookup function', () => {
		it('should generate correct lookup for 8x16 characters', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const expectedPoints = characterDimensions8x16.height * 8;

			// Should have entries for all trace points
			expect(Object.keys(lookup)).toHaveLength(expectedPoints);

			// Check specific entries exist
			expect(lookup[0]).toBeDefined();
			expect(lookup[1]).toBeDefined();
			expect(lookup[expectedPoints - 1]).toBeDefined();
		});

		it('should generate correct lookup for 6x10 characters', () => {
			const lookup = generateLookup(characterDimensions6x10.width, characterDimensions6x10.height);

			const expectedPoints = characterDimensions6x10.height * 8;

			// Should have entries for all trace points
			expect(Object.keys(lookup)).toHaveLength(expectedPoints);

			// Check specific entries exist
			expect(lookup[0]).toBeDefined();
			expect(lookup[1]).toBeDefined();
			expect(lookup[expectedPoints - 1]).toBeDefined();
		});

		it('should generate correct sprite coordinates for first point', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const firstPoint = lookup[0];

			validateSpriteCoordinates(
				firstPoint,
				600, // offsetX
				300, // offsetY
				1, // spriteWidth (1 pixel)
				characterDimensions8x16.height * 8 // spriteHeight (full plot height)
			);
		});

		it('should generate correct sprite coordinates with increasing x values', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			// Check that x coordinates increase by 1 for each point
			for (let i = 0; i < 10; i++) {
				const point = lookup[i];
				expect(point.x).toBe(600 + i); // offsetX + i
				expect(point.y).toBe(300); // offsetY (constant)
				expect(point.spriteWidth).toBe(1);
				expect(point.spriteHeight).toBe(characterDimensions8x16.height * 8);
			}
		});

		it('should generate coordinates with consistent dimensions', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const coordinates = Object.values(lookup);

			// All coordinates should have same Y, width, and height
			coordinates.forEach(coord => {
				expect(coord.y).toBe(300);
				expect(coord.spriteWidth).toBe(1);
				expect(coord.spriteHeight).toBe(characterDimensions8x16.height * 8);
			});

			// X coordinates should be sequential
			const sortedCoords = coordinates.sort((a, b) => a.x - b.x);
			for (let i = 1; i < sortedCoords.length; i++) {
				expect(sortedCoords[i].x).toBe(sortedCoords[i - 1].x + 1);
			}
		});

		it('should handle different character heights correctly', () => {
			const lookup8x16 = generateLookup(8, 16);
			const lookup6x10 = generateLookup(6, 10);

			const coord8x16 = lookup8x16[0];
			const coord6x10 = lookup6x10[0];

			// Should have same x, y, width but different height
			expect(coord8x16.x).toBe(coord6x10.x);
			expect(coord8x16.y).toBe(coord6x10.y);
			expect(coord8x16.spriteWidth).toBe(coord6x10.spriteWidth);
			expect(coord8x16.spriteHeight).toBe(16 * 8);
			expect(coord6x10.spriteHeight).toBe(10 * 8);

			// Should have different number of lookup entries
			expect(Object.keys(lookup8x16)).toHaveLength(16 * 8);
			expect(Object.keys(lookup6x10)).toHaveLength(10 * 8);
		});

		it('should generate sequential numeric keys', () => {
			const lookup = generateLookup(characterDimensions8x16.width, characterDimensions8x16.height);

			const keys = Object.keys(lookup)
				.map(Number)
				.sort((a, b) => a - b);
			const expectedKeys = Array.from({ length: characterDimensions8x16.height * 8 }, (_, i) => i);

			expect(keys).toEqual(expectedKeys);
		});
	});
});
