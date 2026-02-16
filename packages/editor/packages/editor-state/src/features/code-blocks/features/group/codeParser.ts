/**
 * Parses ; @group directive from code block lines.
 *
 * A code block is assigned a group name if it contains a line matching the pattern:
 * "; @group <groupName>"
 *
 * @param code - Array of code lines to parse
 * @returns The group name if a valid @group directive is found, undefined otherwise
 *
 * @example
 * ```typescript
 * const code = [
 *   'module myModule',
 *   '; @group audio-chain',
 *   'output out 1',
 *   'moduleEnd'
 * ];
 * const groupName = parseGroup(code); // 'audio-chain'
 * ```
 */
export default function parseGroup(code: string[]): string | undefined {
	for (const line of code) {
		// Match semicolon comment lines with @group directive followed by an argument
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'group') {
			// Extract the first token from the args as the group name
			const args = commentMatch[2].trim();
			if (args.length > 0) {
				// First word/token is the group name
				const groupName = args.split(/\s+/)[0];
				return groupName;
			}
		}
	}
	return undefined;
}
