import { expect } from 'vitest';
import { SpriteCoordinates } from 'glugglug';

import { Command } from '../../src/types';

import type { DrawingCommand } from '../../src/types';

/**
 * Utility to validate sprite coordinates
 */
export function validateSpriteCoordinates(
	coordinates: SpriteCoordinates,
	expectedX: number,
	expectedY: number,
	expectedWidth: number,
	expectedHeight: number
): void {
	expect(coordinates.x).toBe(expectedX);
	expect(coordinates.y).toBe(expectedY);
	expect(coordinates.spriteWidth).toBe(expectedWidth);
	expect(coordinates.spriteHeight).toBe(expectedHeight);
}

/**
 * Utility to validate drawing command structure
 */
export function validateDrawingCommand(
	command: DrawingCommand,
	expectedType: Command,
	expectedParams?: unknown[]
): void {
	expect(command[0]).toBe(expectedType);
	if (expectedParams) {
		expect(command.slice(1)).toEqual(expectedParams);
	}
}

/**
 * Utility to find a specific command type in a command array
 */
export function findCommand(commands: DrawingCommand[], commandType: Command): DrawingCommand | undefined {
	return commands.find(cmd => cmd[0] === commandType);
}

/**
 * Utility to find all commands of a specific type in a command array
 */
export function findAllCommands(commands: DrawingCommand[], commandType: Command): DrawingCommand[] {
	return commands.filter(cmd => cmd[0] === commandType);
}

/**
 * Utility to validate that required command types are present
 */
export function validateRequiredCommands(commands: DrawingCommand[], requiredTypes: Command[]): void {
	requiredTypes.forEach(type => {
		const command = findCommand(commands, type);
		expect(command).toBeDefined();
	});
}

/**
 * Mock function to create deterministic test data
 */
export function createMockBitmap(size: number): number[] {
	return Array.from({ length: size }, (_, i) => i % 256);
}
