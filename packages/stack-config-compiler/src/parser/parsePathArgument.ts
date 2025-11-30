import { parseEscapes } from './parseEscapes';
import { splitPath } from './splitPath';

/** Regex to match string literals with escape sequences */
const STRING_LITERAL_REGEX = /^"((?:[^"\\]|\\.)*)"/;

/**
 * Parses a path argument (quoted or unquoted)
 */
export function parsePathArgument(arg: string): string[] | { error: string } {
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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parsePathArgument', () => {
		it('should parse quoted path', () => {
			expect(parsePathArgument('"foo.bar"')).toEqual(['foo', 'bar']);
		});

		it('should parse unquoted path', () => {
			expect(parsePathArgument('foo.bar')).toEqual(['foo', 'bar']);
		});

		it('should handle path with escapes', () => {
			expect(parsePathArgument('"foo\\nbar"')).toEqual(['foo\nbar']);
		});

		it('should return error for unclosed quote', () => {
			expect(parsePathArgument('"foo')).toEqual({ error: 'Invalid path: "foo' });
		});

		it('should return error for malformed path', () => {
			expect(parsePathArgument('foo[0')).toEqual({ error: 'Malformed path: unclosed bracket in "foo[0"' });
		});

		it('should parse path with array index', () => {
			expect(parsePathArgument('"items[0]"')).toEqual(['items', '[0]']);
		});
	});
}
