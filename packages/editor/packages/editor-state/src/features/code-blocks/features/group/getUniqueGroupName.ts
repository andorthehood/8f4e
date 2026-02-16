import type { CodeBlockGraphicData } from '~/types';

/**
 * Gets all existing group names in the code blocks
 */
function getAllGroupNames(codeBlocks: CodeBlockGraphicData[]): Set<string> {
	const groupNames = new Set<string>();
	for (const block of codeBlocks) {
		if (block.groupName) {
			groupNames.add(block.groupName);
		}
	}
	return groupNames;
}

/**
 * Increments a group name by adding or incrementing a trailing number.
 * Examples:
 * - 'foo' -> 'foo1'
 * - 'foo1' -> 'foo2'
 * - 'bass09' -> 'bass10'
 */
function incrementGroupName(name: string): string {
	// Check if the name ends with a number
	// Use non-greedy match for the base name to ensure all trailing digits are captured by the greedy \d+
	const match = name.match(/^(.*?)(\d+)$/);
	if (match) {
		// Name ends with a number, increment it
		const baseName = match[1];
		const numberPart = match[2];
		const currentNumber = parseInt(numberPart, 10);
		return baseName + (currentNumber + 1);
	} else {
		// Name doesn't end with a number, append '1'
		return name + '1';
	}
}

/**
 * Generates a unique group name that doesn't collide with existing group names.
 * If the input name already exists, it increments the trailing number until a unique name is found.
 *
 * @param desiredName - The desired group name
 * @param existingGroupNames - Set of existing group names to check against
 * @returns A unique group name that doesn't exist in the existingGroupNames set
 *
 * @example
 * ```typescript
 * const existingNames = new Set(['foo', 'foo1', 'bar']);
 * getUniqueGroupName('foo', existingNames); // Returns 'foo2'
 * getUniqueGroupName('bar', existingNames); // Returns 'bar1'
 * getUniqueGroupName('baz', existingNames); // Returns 'baz' (no collision)
 * ```
 */
export function getUniqueGroupName(desiredName: string, existingGroupNames: Set<string>): string {
	let candidateName = desiredName;

	// If the name doesn't exist, return it as-is
	if (!existingGroupNames.has(candidateName)) {
		return candidateName;
	}

	// Keep incrementing until we find a unique name
	while (existingGroupNames.has(candidateName)) {
		candidateName = incrementGroupName(candidateName);
	}

	return candidateName;
}

/**
 * Creates a mapping of original group names to unique group names for pasted blocks.
 * This ensures all blocks with the same original group name get the same new group name.
 *
 * @param pastedGroupNames - Array of group names from pasted blocks (may contain duplicates)
 * @param codeBlocks - Existing code blocks to check for name collisions
 * @returns Map from original group name to unique renamed group name
 */
export function createGroupNameMapping(
	pastedGroupNames: string[],
	codeBlocks: CodeBlockGraphicData[]
): Map<string, string> {
	const existingGroupNames = getAllGroupNames(codeBlocks);
	const mapping = new Map<string, string>();

	// Get unique pasted group names
	const uniquePastedNames = Array.from(new Set(pastedGroupNames));

	for (const originalName of uniquePastedNames) {
		const uniqueName = getUniqueGroupName(originalName, existingGroupNames);
		mapping.set(originalName, uniqueName);
		// Add the new name to the set to avoid collisions between pasted groups
		existingGroupNames.add(uniqueName);
	}

	return mapping;
}
