import { parseLiteral } from './parseLiteral';
import { parsePathArgument } from './parsePathArgument';

import type { Command, CommandType, CompileError } from '../types';

/** Regex to match a complete line with command and optional argument, stripping trailing comments */
const LINE_REGEX = /^\s*(\w+)(?:\s+(.+?))?\s*(?:;.*)?$/;

/** Valid command types (case-sensitive) */
const VALID_COMMANDS = new Set<CommandType>(['push', 'set', 'append', 'scope', 'rescopeTop', 'rescope', 'endScope']);

/**
 * Parses a single line into a command
 */
export function parseLine(line: string, lineNumber: number): Command | CompileError | null {
	const trimmed = line.trim();

	// Skip empty lines and lines that start with a comment
	if (!trimmed || trimmed.startsWith(';')) {
		return null;
	}

	const match = trimmed.match(LINE_REGEX);
	if (!match) {
		return { line: lineNumber, message: `Invalid syntax: ${trimmed}` };
	}

	const [, commandName, argument] = match;

	// Case-sensitive command matching
	if (!VALID_COMMANDS.has(commandName as CommandType)) {
		return { line: lineNumber, message: `Unknown command: ${commandName}` };
	}

	const command: Command = { type: commandName as CommandType, lineNumber };

	switch (commandName) {
		case 'push': {
			if (!argument) {
				return { line: lineNumber, message: 'push requires a literal argument' };
			}
			const literal = parseLiteral(argument);
			if (typeof literal === 'object' && literal !== null && 'error' in literal) {
				return { line: lineNumber, message: literal.error };
			}
			command.argument = literal;
			break;
		}

		case 'scope':
		case 'rescopeTop':
		case 'rescope': {
			if (!argument) {
				return { line: lineNumber, message: `${commandName} requires a path argument` };
			}
			const pathResult = parsePathArgument(argument);
			if ('error' in pathResult) {
				return { line: lineNumber, message: pathResult.error };
			}
			command.pathSegments = pathResult;
			break;
		}
	}

	return command;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseLine', () => {
		it('should return null for empty line', () => {
			expect(parseLine('', 1)).toBe(null);
		});

		it('should return null for whitespace-only line', () => {
			expect(parseLine('   ', 1)).toBe(null);
		});

		it('should return null for comment', () => {
			expect(parseLine('; this is a comment', 1)).toBe(null);
		});

		it('should parse push command with string', () => {
			expect(parseLine('push "hello"', 1)).toEqual({
				type: 'push',
				argument: 'hello',
				lineNumber: 1,
			});
		});

		it('should parse push command with number', () => {
			expect(parseLine('push 42', 1)).toEqual({
				type: 'push',
				argument: 42,
				lineNumber: 1,
			});
		});

		it('should parse scope command', () => {
			expect(parseLine('scope "foo.bar"', 1)).toEqual({
				type: 'scope',
				pathSegments: ['foo', 'bar'],
				lineNumber: 1,
			});
		});

		it('should parse set command', () => {
			expect(parseLine('set', 1)).toEqual({
				type: 'set',
				lineNumber: 1,
			});
		});

		it('should return error for unknown command', () => {
			expect(parseLine('unknown', 1)).toEqual({
				line: 1,
				message: 'Unknown command: unknown',
			});
		});

		it('should return error for push without argument', () => {
			expect(parseLine('push', 1)).toEqual({
				line: 1,
				message: 'push requires a literal argument',
			});
		});

		it('should be case-sensitive for commands', () => {
			expect(parseLine('PUSH 123', 1)).toEqual({
				line: 1,
				message: 'Unknown command: PUSH',
			});
		});

		it('should strip trailing comments', () => {
			expect(parseLine('push "hello" ; this is a comment', 1)).toEqual({
				type: 'push',
				argument: 'hello',
				lineNumber: 1,
			});
		});

		it('should strip trailing comments after set', () => {
			expect(parseLine('set ; save the value', 1)).toEqual({
				type: 'set',
				lineNumber: 1,
			});
		});
	});
}
