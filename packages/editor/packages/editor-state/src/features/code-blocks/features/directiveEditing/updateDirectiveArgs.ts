import { parseDirectiveComment } from '../directives/utils';

/**
 * Updates the arguments of all existing directive lines in code.
 *
 * For each line containing the named directive, calls the updater with the
 * current args and replaces the line with the canonical form using the
 * returned args.
 *
 * @param code - Array of code lines
 * @param name - Directive name to update (e.g., 'group')
 * @param updater - Function that receives current args and returns new args
 * @returns New code array with updated directive lines
 *
 * @example
 * ```typescript
 * const code = ['module test', '; @group audio', 'moduleEnd'];
 * const updated = updateDirectiveArgs(code, 'group', ([name]) => [name, 'nonstick']);
 * // Result: ['module test', '; @group audio nonstick', 'moduleEnd']
 * ```
 */
export function updateDirectiveArgs(code: string[], name: string, updater: (args: string[]) => string[]): string[] {
	return code.map(line => {
		const parsed = parseDirectiveComment(line);
		if (!parsed || parsed.name !== name) {
			return line;
		}

		const newArgs = updater(parsed.args);
		return newArgs.length > 0 ? `; @${name} ${newArgs.join(' ')}` : `; @${name}`;
	});
}
