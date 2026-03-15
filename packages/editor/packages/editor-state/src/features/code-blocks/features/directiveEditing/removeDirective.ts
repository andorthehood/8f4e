import { parseDirectiveComment } from '../directives/utils';

/**
 * Removes all lines containing a specific directive from code.
 *
 * @param code - Array of code lines
 * @param name - Name of the directive to remove (e.g., 'group', 'watch')
 * @returns New array with directive lines removed
 *
 * @example
 * ```typescript
 * const code = ['module test', '; @group myGroup', '; @favorite', 'moduleEnd'];
 * const filtered = removeDirective(code, 'group');
 * // Returns: ['module test', '; @favorite', 'moduleEnd']
 * ```
 */
export function removeDirective(code: string[], name: string): string[] {
	return code.filter(line => parseDirectiveComment(line)?.name !== name);
}
