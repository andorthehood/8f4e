import { createVMState } from './createVMState';
import { executeCommand } from './executeCommand';

import type { Command, CompileError } from '../types';
import type { SchemaNode } from '../schema';

/**
 * Executes a list of commands and returns the final config or errors
 */
export function executeCommands(
	commands: Command[],
	schemaRoot?: SchemaNode
): { config: Record<string, unknown>; errors: CompileError[]; writtenPaths?: Set<string> } {
	const state = createVMState(schemaRoot);
	const errors: CompileError[] = [];

	for (const command of commands) {
		const commandErrors = executeCommand(state, command);
		if (commandErrors) {
			for (const error of commandErrors) {
				errors.push({
					line: command.lineNumber,
					...error,
				});
			}
		}
	}

	return {
		config: state.config,
		errors,
		writtenPaths: state.writtenPaths,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeCommands', () => {
		it('should execute empty command list', () => {
			expect(executeCommands([])).toMatchObject({ config: {}, errors: [] });
		});

		it('should execute single command', () => {
			const commands = [
				{ type: 'scope' as const, pathSegments: ['name'], lineNumber: 1 },
				{ type: 'push' as const, argument: 'test', lineNumber: 2 },
				{ type: 'set' as const, lineNumber: 3 },
			];
			const result = executeCommands(commands);
			expect(result.config).toEqual({ name: 'test' });
			expect(result.errors).toHaveLength(0);
		});

		it('should collect errors', () => {
			const commands = [{ type: 'set' as const, lineNumber: 1 }];
			const result = executeCommands(commands);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].line).toBe(1);
		});

		it('should continue after error', () => {
			const commands = [
				{ type: 'set' as const, lineNumber: 1 }, // Error: empty stack
				{ type: 'scope' as const, pathSegments: ['name'], lineNumber: 2 },
				{ type: 'push' as const, argument: 'test', lineNumber: 3 },
				{ type: 'set' as const, lineNumber: 4 },
			];
			const result = executeCommands(commands);
			expect(result.config).toEqual({ name: 'test' });
			expect(result.errors).toHaveLength(1);
		});
	});
}
