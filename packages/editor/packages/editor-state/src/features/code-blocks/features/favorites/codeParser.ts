/**
 * Parses ; @favorite directive from code block lines.
 *
 * A code block is considered a favorite if it contains at least one line
 * matching the pattern: "; @favorite"
 *
 * @param code - Array of code lines to parse
 * @returns true if the code block contains a @favorite directive, false otherwise
 *
 * @example
 * ```typescript
 * const code = [
 *   'module myModule',
 *   '; @favorite',
 *   'output out 1',
 *   'moduleEnd'
 * ];
 * const isFavorite = parseFavorite(code); // true
 * ```
 */
export default function parseFavorite(code: string[]): boolean {
	for (const line of code) {
		// Match semicolon comment lines with @favorite directive
		const commentMatch = line.match(/^\s*;\s*@(\w+)/);
		if (commentMatch && commentMatch[1] === 'favorite') {
			return true;
		}
	}
	return false;
}
