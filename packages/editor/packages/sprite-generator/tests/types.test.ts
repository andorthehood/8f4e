import { describe, it, expect } from 'vitest';

import { minimalColorScheme, config8x16, config6x10 } from './utils/testFixtures';

import { Command } from '../src/types';

import type { DrawingCommand } from '../src/types';

describe('Types and Enums', () => {
	describe('Command enum', () => {
		it('should have correct command values', () => {
			expect(Command.FILL_COLOR).toBe(0);
			expect(Command.RECTANGLE).toBe(1);
			expect(Command.TRANSLATE).toBe(2);
			expect(Command.SAVE).toBe(3);
			expect(Command.RESTORE).toBe(4);
			expect(Command.RESET_TRANSFORM).toBe(5);
			expect(Command.PIXEL).toBe(6);
		});

		it('should have all required command types', () => {
			const commandKeys = Object.keys(Command).filter(key => isNaN(Number(key)));
			expect(commandKeys).toContain('FILL_COLOR');
			expect(commandKeys).toContain('RECTANGLE');
			expect(commandKeys).toContain('TRANSLATE');
			expect(commandKeys).toContain('SAVE');
			expect(commandKeys).toContain('RESTORE');
			expect(commandKeys).toContain('RESET_TRANSFORM');
			expect(commandKeys).toContain('PIXEL');
		});
	});

	describe('DrawingCommand type validation', () => {
		it('should validate FILL_COLOR command structure', () => {
			const command: DrawingCommand = [Command.FILL_COLOR, '#ff0000'];
			expect(command[0]).toBe(Command.FILL_COLOR);
			expect(command[1]).toBe('#ff0000');
			expect(command.length).toBe(2);
		});

		it('should validate RECTANGLE command structure', () => {
			const command: DrawingCommand = [Command.RECTANGLE, 10, 20, 30, 40];
			expect(command[0]).toBe(Command.RECTANGLE);
			expect(command[1]).toBe(10);
			expect(command[2]).toBe(20);
			expect(command[3]).toBe(30);
			expect(command[4]).toBe(40);
			expect(command.length).toBe(5);
		});

		it('should validate TRANSLATE command structure', () => {
			const command: DrawingCommand = [Command.TRANSLATE, 5, 15];
			expect(command[0]).toBe(Command.TRANSLATE);
			expect(command[1]).toBe(5);
			expect(command[2]).toBe(15);
			expect(command.length).toBe(3);
		});

		it('should validate PIXEL command structure', () => {
			const command: DrawingCommand = [Command.PIXEL, 1, 2];
			expect(command[0]).toBe(Command.PIXEL);
			expect(command[1]).toBe(1);
			expect(command[2]).toBe(2);
			expect(command.length).toBe(3);
		});

		it('should validate commands without parameters', () => {
			const saveCommand: DrawingCommand = [Command.SAVE];
			const restoreCommand: DrawingCommand = [Command.RESTORE];
			const resetCommand: DrawingCommand = [Command.RESET_TRANSFORM];

			expect(saveCommand[0]).toBe(Command.SAVE);
			expect(saveCommand.length).toBe(1);

			expect(restoreCommand[0]).toBe(Command.RESTORE);
			expect(restoreCommand.length).toBe(1);

			expect(resetCommand[0]).toBe(Command.RESET_TRANSFORM);
			expect(resetCommand.length).toBe(1);
		});
	});

	describe('ColorScheme validation', () => {
		it('should have all required text color properties', () => {
			const textKeys = Object.keys(minimalColorScheme.text);
			expect(textKeys).toContain('lineNumber');
			expect(textKeys).toContain('instruction');
			expect(textKeys).toContain('codeComment');
			expect(textKeys).toContain('code');
			expect(textKeys).toContain('numbers');
			expect(textKeys).toContain('menuItemText');
			expect(textKeys).toContain('menuItemTextHighlighted');
			expect(textKeys).toContain('dialogText');
			expect(textKeys).toContain('dialogTitle');
			expect(textKeys).toContain('binaryZero');
			expect(textKeys).toContain('binaryOne');
		});

		it('should have all required fill color properties', () => {
			const fillKeys = Object.keys(minimalColorScheme.fill);
			expect(fillKeys).toContain('menuItemBackground');
			expect(fillKeys).toContain('menuItemBackgroundHighlighted');
			expect(fillKeys).toContain('background');
			expect(fillKeys).toContain('backgroundDots');
			expect(fillKeys).toContain('backgroundDots2');
			expect(fillKeys).toContain('moduleBackground');
			expect(fillKeys).toContain('moduleBackgroundDragged');
			expect(fillKeys).toContain('wire');
			expect(fillKeys).toContain('wireHighlighted');
			expect(fillKeys).toContain('errorMessageBackground');
			expect(fillKeys).toContain('dialogBackground');
			expect(fillKeys).toContain('dialogDimmer');
			expect(fillKeys).toContain('highlightedCodeLine');
			expect(fillKeys).toContain('plotterTrace');
			expect(fillKeys).toContain('plotterBackground');
		});

		it('should have all required icon color properties', () => {
			const iconKeys = Object.keys(minimalColorScheme.icons);
			expect(iconKeys).toContain('inputConnector');
			expect(iconKeys).toContain('outputConnector');
			expect(iconKeys).toContain('inputConnectorBackground');
			expect(iconKeys).toContain('outputConnectorBackground');
			expect(iconKeys).toContain('switchBackground');
			expect(iconKeys).toContain('feedbackScale');
			expect(iconKeys).toContain('arrow');
			expect(iconKeys).toContain('pianoKeyWhite');
			expect(iconKeys).toContain('pianoKeyWhiteHighlighted');
			expect(iconKeys).toContain('pianoKeyWhitePressed');
			expect(iconKeys).toContain('pianoKeyBlack');
			expect(iconKeys).toContain('pianoKeyBlackHighlighted');
			expect(iconKeys).toContain('pianoKeyBlackPressed');
			expect(iconKeys).toContain('pianoKeyboardBackground');
			expect(iconKeys).toContain('pianoKeyboardNote');
			expect(iconKeys).toContain('pianoKeyboardNoteHighlighted');
		});

		it('should have feedbackScale as an array', () => {
			expect(Array.isArray(minimalColorScheme.icons.feedbackScale)).toBe(true);
			expect(minimalColorScheme.icons.feedbackScale.length).toBeGreaterThan(0);
		});
	});

	describe('Config validation', () => {
		it('should validate 8x16 font config', () => {
			expect(config8x16.font).toBe('8x16');
			expect(config8x16.colorScheme).toBeDefined();
			expect(config8x16.colorScheme.text).toBeDefined();
			expect(config8x16.colorScheme.fill).toBeDefined();
			expect(config8x16.colorScheme.icons).toBeDefined();
		});

		it('should validate 6x10 font config', () => {
			expect(config6x10.font).toBe('6x10');
			expect(config6x10.colorScheme).toBeDefined();
			expect(config6x10.colorScheme.text).toBeDefined();
			expect(config6x10.colorScheme.fill).toBeDefined();
			expect(config6x10.colorScheme.icons).toBeDefined();
		});

		it('should support both font types', () => {
			expect(['6x10', '8x16']).toContain(config8x16.font);
			expect(['6x10', '8x16']).toContain(config6x10.font);
		});
	});
});
