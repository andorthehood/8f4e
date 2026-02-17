/**
 * Replaces the group name in a @group directive line.
 *
 * @param line - The code line to process
 * @param oldGroupName - The group name to replace
 * @param newGroupName - The new group name
 * @returns The updated line, or the original line if no match
 *
 * @example
 * replaceGroupName('; @group audio sticky', 'audio', 'audio1')
 * // Returns: '; @group audio1 sticky'
 */
export function replaceGroupName(line: string, oldGroupName: string, newGroupName: string): string {
	// Match the @group directive with optional trailing content (like 'sticky')
	const match = line.match(/^(\s*;\s*@group\s+)(\S+)(\s.*)?$/);
	if (match && match[2] === oldGroupName) {
		return match[1] + newGroupName + (match[3] || '');
	}
	return line;
}
