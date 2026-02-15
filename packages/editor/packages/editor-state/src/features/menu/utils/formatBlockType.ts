import type { CodeBlockType } from '~/types';

/**
 * Formats a code block type for display in menus.
 * Converts camelCase block types to human-friendly labels.
 *
 * @param blockType - The block type to format
 * @returns Human-friendly label for the block type
 *
 * @example
 * ```typescript
 * formatBlockType('module'); // 'module'
 * formatBlockType('vertexShader'); // 'vertex shader'
 * formatBlockType('fragmentShader'); // 'fragment shader'
 * ```
 */
export default function formatBlockType(blockType: CodeBlockType): string {
	switch (blockType) {
		case 'vertexShader':
			return 'vertex shader';
		case 'fragmentShader':
			return 'fragment shader';
		default:
			return blockType;
	}
}
