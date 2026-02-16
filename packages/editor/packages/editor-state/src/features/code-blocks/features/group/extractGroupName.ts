import parseGroup from './codeParser';

/**
 * Extracts group name from code block lines.
 * Returns undefined if no group directive is found.
 *
 * This is a convenience wrapper around parseGroup that returns only the group name.
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
	const groupInfo = parseGroup(code);
	return groupInfo?.groupName;
}
