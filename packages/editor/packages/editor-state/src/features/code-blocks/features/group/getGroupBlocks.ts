import type { CodeBlockGraphicData } from '~/types';

/**
 * Filters code blocks by group name.
 *
 * @param codeBlocks - Array of all code blocks
 * @param groupName - The group name to filter by
 * @returns Array of code blocks that belong to the specified group
 */
export function getGroupBlocks(codeBlocks: CodeBlockGraphicData[], groupName: string): CodeBlockGraphicData[] {
	return codeBlocks.filter(block => block.groupName === groupName);
}

/**
 * Filters module code blocks by group name.
 *
 * @param codeBlocks - Array of all code blocks
 * @param groupName - The group name to filter by
 * @returns Array of module code blocks that belong to the specified group
 */
export function getGroupModuleBlocks(codeBlocks: CodeBlockGraphicData[], groupName: string): CodeBlockGraphicData[] {
	return codeBlocks.filter(block => block.groupName === groupName && block.blockType === 'module');
}
