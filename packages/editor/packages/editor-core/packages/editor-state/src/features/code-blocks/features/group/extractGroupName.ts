import { parseDirectiveComments } from '../directives/utils';

/**
 * Extracts group name from code block lines.
 * Returns undefined if no valid @group directive with a name argument is found.
 *
 * @param code - Array of code lines to parse
 * @returns The group name if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const code = ['module foo', '; @group audio', 'moduleEnd'];
 * const groupName = extractGroupName(code); // 'audio'
 * ```
 */
export function extractGroupName(code: string[]): string | undefined {
	for (const line of code) {
		for (const parsed of parseDirectiveComments(line)) {
			if (parsed.name === 'group' && parsed.args[0]) {
				return parsed.args[0];
			}
		}
	}
	return undefined;
}
