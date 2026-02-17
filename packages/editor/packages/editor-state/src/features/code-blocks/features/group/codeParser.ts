export interface GroupParseResult {
	groupName: string;
	nonstick: boolean;
}

/**
 * Parses ; @group directive from code block lines.
 *
 * A code block is assigned a group name if it contains a line matching the pattern:
 * "; @group <groupName> [nonstick]"
 *
 * @param code - Array of code lines to parse
 * @returns Object with groupName and nonstick flag if a valid @group directive is found, undefined otherwise
 *
 * @example
 * ```typescript
 * const code = [
 *   'module myModule',
 *   '; @group audio-chain nonstick',
 *   'output out 1',
 *   'moduleEnd'
 * ];
 * const result = parseGroup(code); // { groupName: 'audio-chain', nonstick: true }
 * ```
 */
export default function parseGroup(code: string[]): GroupParseResult | undefined {
	for (const line of code) {
		// Match semicolon comment lines with @group directive followed by an argument
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'group') {
			// Extract the first token from the args as the group name
			const args = commentMatch[2].trim();
			if (args.length > 0) {
				const tokens = args.split(/\s+/);
				// First word/token is the group name
				const groupName = tokens[0];
				// Second token (if present and equals 'nonstick') sets nonstick flag
				const nonstick = tokens.length > 1 && tokens[1] === 'nonstick';
				return { groupName, nonstick };
			}
		}
	}
	return undefined;
}
