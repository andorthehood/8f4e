/**
 * Parser for the stack config language
 * Converts line-based source into an array of commands
 */

import type { Command, CommandType, CompileError, Literal } from './types';

/**
 * Checks if a line is a comment (starts with ';')
 */
function isComment(line: string): boolean {
	return line.trimStart().startsWith(';');
}

/**
 * Checks if a line is empty or whitespace only
 */
function isEmptyLine(line: string): boolean {
	return line.trim() === '';
}

/**
 * Parses a string literal (quoted with double quotes)
 */
function parseStringLiteral(token: string): { value: string; consumed: number } | null {
	if (!token.startsWith('"')) {
		return null;
	}

	// Find the closing quote
	let i = 1;
	let result = '';
	while (i < token.length) {
		const char = token[i];
		if (char === '\\' && i + 1 < token.length) {
			// Handle escape sequences
			const next = token[i + 1];
			switch (next) {
				case '"':
					result += '"';
					break;
				case '\\':
					result += '\\';
					break;
				case 'n':
					result += '\n';
					break;
				case 't':
					result += '\t';
					break;
				default:
					result += next;
			}
			i += 2;
		} else if (char === '"') {
			return { value: result, consumed: i + 1 };
		} else {
			result += char;
			i++;
		}
	}

	// Unclosed string
	return null;
}

/**
 * Parses a literal value (string, number, boolean, null)
 */
function parseLiteral(token: string): Literal | { error: string } {
	// Check for string literal
	if (token.startsWith('"')) {
		const result = parseStringLiteral(token);
		if (!result) {
			return { error: `Invalid string literal: ${token}` };
		}
		return result.value;
	}

	// Check for boolean
	if (token === 'true') return true;
	if (token === 'false') return false;

	// Check for null
	if (token === 'null') return null;

	// Check for number
	const num = parseFloat(token);
	if (!isNaN(num)) {
		return num;
	}

	return { error: `Invalid literal: ${token}` };
}

/**
 * Tokenizes a line into command and arguments
 * Handles quoted strings correctly
 */
function tokenizeLine(line: string): string[] {
	const tokens: string[] = [];
	let i = 0;

	while (i < line.length) {
		// Skip whitespace
		while (i < line.length && /\s/.test(line[i])) {
			i++;
		}

		if (i >= line.length) break;

		// Check for quoted string
		if (line[i] === '"') {
			const start = i;
			i++; // Skip opening quote
			while (i < line.length && line[i] !== '"') {
				if (line[i] === '\\' && i + 1 < line.length) {
					i += 2; // Skip escaped character
				} else {
					i++;
				}
			}
			if (i < line.length) {
				i++; // Skip closing quote
			}
			tokens.push(line.slice(start, i));
		} else {
			// Regular token
			const start = i;
			while (i < line.length && !/\s/.test(line[i])) {
				i++;
			}
			tokens.push(line.slice(start, i));
		}
	}

	return tokens;
}

/**
 * Valid command types in the language
 */
const VALID_COMMANDS: Set<CommandType> = new Set([
	'push',
	'set',
	'append',
	'scope',
	'rescopeTop',
	'rescope',
	'endScope',
]);

/**
 * Parses a single line into a command
 */
function parseLine(line: string, lineNumber: number): Command | CompileError | null {
	// Skip empty lines and comments
	if (isEmptyLine(line) || isComment(line)) {
		return null;
	}

	const tokens = tokenizeLine(line.trim());

	if (tokens.length === 0) {
		return null;
	}

	const commandName = tokens[0].toLowerCase();

	// Handle case-insensitive command names but preserve case for matching
	const matchedCommand = Array.from(VALID_COMMANDS).find(cmd => cmd.toLowerCase() === commandName);

	if (!matchedCommand) {
		return {
			line: lineNumber,
			message: `Unknown command: ${tokens[0]}`,
		};
	}

	const command: Command = {
		type: matchedCommand,
		lineNumber,
	};

	switch (matchedCommand) {
		case 'push': {
			if (tokens.length < 2) {
				return {
					line: lineNumber,
					message: 'push requires a literal argument',
				};
			}

			const literal = parseLiteral(tokens[1]);
			if (typeof literal === 'object' && literal !== null && 'error' in literal) {
				return {
					line: lineNumber,
					message: literal.error,
				};
			}
			command.argument = literal;
			break;
		}

		case 'scope':
		case 'rescopeTop':
		case 'rescope': {
			if (tokens.length < 2) {
				return {
					line: lineNumber,
					message: `${matchedCommand} requires a path argument`,
				};
			}

			// Parse the path - it should be a quoted string
			const pathArg = tokens[1];
			if (pathArg.startsWith('"')) {
				const result = parseStringLiteral(pathArg);
				if (!result) {
					return {
						line: lineNumber,
						message: `Invalid path: ${pathArg}`,
					};
				}
				command.argument = result.value;
			} else {
				// Allow unquoted paths for convenience
				command.argument = pathArg;
			}
			break;
		}

		case 'set':
		case 'append':
		case 'endScope':
			// These commands don't take arguments
			break;
	}

	return command;
}

/**
 * Parses a source string into an array of commands
 */
export function parse(source: string): { commands: Command[]; errors: CompileError[] } {
	const lines = source.split('\n');
	const commands: Command[] = [];
	const errors: CompileError[] = [];

	for (let i = 0; i < lines.length; i++) {
		const lineNumber = i + 1; // 1-based line numbers
		const result = parseLine(lines[i], lineNumber);

		if (result === null) {
			// Empty line or comment, skip
			continue;
		}

		if ('message' in result) {
			// It's an error
			errors.push(result);
		} else {
			// It's a valid command
			commands.push(result);
		}
	}

	return { commands, errors };
}
