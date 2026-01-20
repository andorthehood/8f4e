import parseLiteral from './parseLiteral';
import parsePathArgument from './parsePathArgument';

import type { Command, CommandType, CompileError } from '../types';

/** Valid command types (case-sensitive) */
const VALID_COMMANDS = new Set<CommandType>([
	'push',
	'set',
	'append',
	'concat',
	'scope',
	'rescopeTop',
	'rescope',
	'rescopeSuffix',
	'popScope',
	'clearScope',
	'const',
]);

/**
 * Strips trailing comment from a line, respecting string literals
 * Returns the line without trailing comments
 */
function stripTrailingComment(line: string): string {
	let inString = false;
	let escaped = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === '\\') {
			escaped = true;
			continue;
		}

		if (char === '"') {
			inString = !inString;
			continue;
		}

		if (char === ';' && !inString) {
			return line.slice(0, i).trimEnd();
		}
	}

	return line;
}

/** Regex to match a complete line with command and optional argument */
const LINE_REGEX = /^\s*(\w+)(?:\s+(.+))?\s*$/;

/**
 * Parses a single line into a command
 */
export default function parseLine(line: string, lineNumber: number): Command | CompileError | null {
	const trimmed = line.trim();

	if (!trimmed || trimmed.startsWith(';')) {
		return null;
	}

	const withoutComment = stripTrailingComment(trimmed);

	const match = withoutComment.match(LINE_REGEX);
	if (!match) {
		return { line: lineNumber, message: `Invalid syntax: ${trimmed}` };
	}

	const [, commandName, argument] = match;

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
				// Try parsing as identifier (uppercase only)
				if (/^[A-Z][A-Z0-9_]*$/.test(argument)) {
					command.identifier = argument;
				} else {
					return { line: lineNumber, message: literal.error };
				}
			} else {
				command.argument = literal;
			}
			break;
		}

		case 'const': {
			if (!argument) {
				return { line: lineNumber, message: 'const requires a name and literal argument' };
			}
			// Parse "NAME <literal>" format
			const constMatch = argument.match(/^([A-Z][A-Z0-9_]*)\s+(.+)$/);
			if (!constMatch) {
				return {
					line: lineNumber,
					message: 'const requires uppercase name followed by literal (e.g., const MAX_VALUE 100)',
				};
			}
			const [, name, literalStr] = constMatch;
			const literal = parseLiteral(literalStr);
			if (typeof literal === 'object' && literal !== null && 'error' in literal) {
				return { line: lineNumber, message: literal.error };
			}
			command.identifier = name;
			command.argument = literal;
			break;
		}

		case 'scope':
		case 'rescopeTop':
		case 'rescope':
		case 'rescopeSuffix': {
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

	describe('stripTrailingComment', () => {
		it('should strip trailing comment', () => {
			expect(stripTrailingComment('push 42 ; comment')).toBe('push 42');
		});

		it('should preserve semicolon inside string', () => {
			expect(stripTrailingComment('push "a;b"')).toBe('push "a;b"');
		});

		it('should handle escaped quotes', () => {
			expect(stripTrailingComment('push "\\";" ; comment')).toBe('push "\\";"');
		});

		it('should return line unchanged if no comment', () => {
			expect(stripTrailingComment('push 42')).toBe('push 42');
		});
	});

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

		it('should parse rescopeSuffix command', () => {
			expect(parseLine('rescopeSuffix "harp.title"', 1)).toEqual({
				type: 'rescopeSuffix',
				pathSegments: ['harp', 'title'],
				lineNumber: 1,
			});
		});

		it('should parse rescopeSuffix with array indices', () => {
			expect(parseLine('rescopeSuffix "runtime[1].config"', 1)).toEqual({
				type: 'rescopeSuffix',
				pathSegments: ['runtime', '[1]', 'config'],
				lineNumber: 1,
			});
		});

		it('should return error for rescopeSuffix without argument', () => {
			expect(parseLine('rescopeSuffix', 1)).toEqual({
				line: 1,
				message: 'rescopeSuffix requires a path argument',
			});
		});

		it('should parse rescopeSuffix with trailing comment', () => {
			expect(parseLine('rescopeSuffix "bar.baz" ; replace suffix', 1)).toEqual({
				type: 'rescopeSuffix',
				pathSegments: ['bar', 'baz'],
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

		it('should preserve semicolons inside string literals', () => {
			expect(parseLine('push "text ; with semicolon"', 1)).toEqual({
				type: 'push',
				argument: 'text ; with semicolon',
				lineNumber: 1,
			});
		});

		it('should handle escaped quotes before semicolons', () => {
			expect(parseLine('push "say \\"hello\\"" ; comment', 1)).toEqual({
				type: 'push',
				argument: 'say "hello"',
				lineNumber: 1,
			});
		});

		it('should parse concat command', () => {
			expect(parseLine('concat', 1)).toEqual({
				type: 'concat',
				lineNumber: 1,
			});
		});

		it('should parse concat command with trailing comment', () => {
			expect(parseLine('concat ; concatenate stack values', 1)).toEqual({
				type: 'concat',
				lineNumber: 1,
			});
		});

		it('should parse const command with string literal', () => {
			expect(parseLine('const BASE_PATH "/var/lib"', 1)).toEqual({
				type: 'const',
				identifier: 'BASE_PATH',
				argument: '/var/lib',
				lineNumber: 1,
			});
		});

		it('should parse const command with number', () => {
			expect(parseLine('const MAX_COUNT 100', 1)).toEqual({
				type: 'const',
				identifier: 'MAX_COUNT',
				argument: 100,
				lineNumber: 1,
			});
		});

		it('should parse const command with boolean', () => {
			expect(parseLine('const ENABLED true', 1)).toEqual({
				type: 'const',
				identifier: 'ENABLED',
				argument: true,
				lineNumber: 1,
			});
		});

		it('should return error for const without argument', () => {
			expect(parseLine('const', 1)).toEqual({
				line: 1,
				message: 'const requires a name and literal argument',
			});
		});

		it('should return error for const with lowercase name', () => {
			expect(parseLine('const myVar 100', 1)).toEqual({
				line: 1,
				message: 'const requires uppercase name followed by literal (e.g., const MAX_VALUE 100)',
			});
		});

		it('should return error for const with invalid literal', () => {
			expect(parseLine('const NAME invalid', 1)).toEqual({
				line: 1,
				message: 'Invalid literal: invalid',
			});
		});

		it('should parse push with identifier', () => {
			expect(parseLine('push MAX_VALUE', 1)).toEqual({
				type: 'push',
				identifier: 'MAX_VALUE',
				lineNumber: 1,
			});
		});

		it('should parse push with underscore in identifier', () => {
			expect(parseLine('push BASE_PATH', 1)).toEqual({
				type: 'push',
				identifier: 'BASE_PATH',
				lineNumber: 1,
			});
		});

		it('should parse push with number in identifier', () => {
			expect(parseLine('push VALUE1', 1)).toEqual({
				type: 'push',
				identifier: 'VALUE1',
				lineNumber: 1,
			});
		});

		it('should parse clearScope command', () => {
			expect(parseLine('clearScope', 1)).toEqual({
				type: 'clearScope',
				lineNumber: 1,
			});
		});

		it('should parse clearScope with trailing comment', () => {
			expect(parseLine('clearScope ; reset to root', 1)).toEqual({
				type: 'clearScope',
				lineNumber: 1,
			});
		});
	});
}
