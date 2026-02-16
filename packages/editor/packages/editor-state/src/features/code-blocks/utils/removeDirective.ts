/**
 * Removes all lines containing a specific directive from code.
 *
 * @param code - Array of code lines
 * @param directiveName - Name of the directive to remove (e.g., 'group', 'favorite')
 * @returns New array with directive lines removed
 *
 * @example
 * ```typescript
 * const code = ['module test', '; @group myGroup', '; @favorite', 'moduleEnd'];
 * const filtered = removeDirective(code, 'group');
 * // Returns: ['module test', '; @favorite', 'moduleEnd']
 * ```
 */
export default function removeDirective(code: string[], directiveName: string): string[] {
	return code.filter(line => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)/);
		return !(commentMatch && commentMatch[1] === directiveName);
	});
}
