/**
 * Parser for the stack config language
 * Converts line-based source into an array of commands
 */

import { splitPathSegments } from './utils';

import type { Command, CommandType, CompileError, Literal } from './types';

/** Regex to match a complete line with command and optional argument */
const LINE_REGEX = /^\s*(\w+)(?:\s+(.+))?\s*$/;

/** Regex to match string literals with escape sequences */
const STRING_LITERAL_REGEX = /^"((?:[^"\\]|\\.)*)"/;

/** Valid command types */
const VALID_COMMANDS = new Set<CommandType>(['push', 'set', 'append', 'scope', 'rescopeTop', 'rescope', 'endScope']);

/**
 * Parses escape sequences in a string
 */
function parseEscapes(str: string): string {
	return str.replace(/\\(.)/g, (_, char) => {
		switch (char) {
			case 'n':
				return '\n';
			case 't':
				return '\t';
			case '"':
				return '"';
			case '\\':
				return '\\';
			default:
				return char;
		}
	});
}

/**
 * Parses a literal value (string, number, boolean, null)
 */
function parseLiteral(token: string): Literal | { error: string } {
	// String literal
	const stringMatch = token.match(STRING_LITERAL_REGEX);
	if (stringMatch) {
		return parseEscapes(stringMatch[1]);
	}

	// Unclosed string
	if (token.startsWith('"')) {
		return { error: `Invalid string literal: ${token}` };
	}

	// Boolean
	if (token === 'true') return true;
	if (token === 'false') return false;

	// Null
	if (token === 'null') return null;

	// Number
	const num = parseFloat(token);
	if (!isNaN(num)) return num;

	return { error: `Invalid literal: ${token}` };
}

/**
 * Splits a path string into segments with error checking
 * Examples: "foo.bar" -> ["foo", "bar"]
 *           "foo[0].bar" -> ["foo", "[0]", "bar"]
 */
function splitPath(path: string): string[] | { error: string } {
	// Check for unclosed brackets
	const openBrackets = (path.match(/\[/g) || []).length;
	const closeBrackets = (path.match(/\]/g) || []).length;
	if (openBrackets !== closeBrackets) {
		return { error: `Malformed path: unclosed bracket in "${path}"` };
	}

	return splitPathSegments(path);
}

/**
 * Parses a path argument (quoted or unquoted)
 */
function parsePathArgument(arg: string): string[] | { error: string } {
	let path = arg;

	// Handle quoted path
	const stringMatch = arg.match(STRING_LITERAL_REGEX);
	if (stringMatch) {
		path = parseEscapes(stringMatch[1]);
	} else if (arg.startsWith('"')) {
		return { error: `Invalid path: ${arg}` };
	}

	return splitPath(path);
}

/**
 * Parses a single line into a command
 */
function parseLine(line: string, lineNumber: number): Command | CompileError | null {
	const trimmed = line.trim();

	// Skip empty lines and comments
	if (!trimmed || trimmed.startsWith(';')) {
		return null;
	}

	const match = trimmed.match(LINE_REGEX);
	if (!match) {
		return { line: lineNumber, message: `Invalid syntax: ${trimmed}` };
	}

	const [, commandName, argument] = match;
	const normalizedCommand = commandName.toLowerCase();

	// Find matching command (case-insensitive)
	const matchedCommand = Array.from(VALID_COMMANDS).find(cmd => cmd.toLowerCase() === normalizedCommand);
	if (!matchedCommand) {
		return { line: lineNumber, message: `Unknown command: ${commandName}` };
	}

	const command: Command = { type: matchedCommand, lineNumber };

	switch (matchedCommand) {
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
				return { line: lineNumber, message: `${matchedCommand} requires a path argument` };
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

/**
 * Parses a source string into an array of commands
 */
export function parse(source: string): { commands: Command[]; errors: CompileError[] } {
	const lines = source.split('\n');
	const commands: Command[] = [];
	const errors: CompileError[] = [];

	for (let i = 0; i < lines.length; i++) {
		const result = parseLine(lines[i], i + 1);

		if (result === null) continue;

		if ('message' in result) {
			errors.push(result);
		} else {
			commands.push(result);
		}
	}

	return { commands, errors };
}
