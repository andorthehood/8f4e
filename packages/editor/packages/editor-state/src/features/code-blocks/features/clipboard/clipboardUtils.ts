import type { CodeBlockGraphicData } from '~/types';

/**
 * Represents a code block in the clipboard payload.
 * This is a simplified representation with only the essential data needed for copy/paste.
 * Disabled state is stored within the code array via the ; @disabled directive.
 */
export interface ClipboardCodeBlock {
	code: string[];
	gridCoordinates: { x: number; y: number };
}

/**
 * Serializes a group of code blocks into a clipboard payload.
 * The payload is a JSON array where gridCoordinates are relative to the anchor block.
 *
 * @param groupBlocks - Array of code blocks to copy (must all be from the same group)
 * @param anchorBlock - The block to use as the reference point (0,0)
 * @returns JSON string representation of the code blocks
 */
export function serializeGroupToClipboard(
	groupBlocks: CodeBlockGraphicData[],
	anchorBlock: CodeBlockGraphicData
): string {
	const clipboardBlocks: ClipboardCodeBlock[] = groupBlocks.map(block => ({
		code: block.code,
		gridCoordinates: {
			x: block.gridX - anchorBlock.gridX,
			y: block.gridY - anchorBlock.gridY,
		},
	}));

	return JSON.stringify(clipboardBlocks);
}

/**
 * Validates if an object matches the expected code block shape.
 */
function isValidClipboardCodeBlock(obj: unknown): obj is ClipboardCodeBlock {
	if (typeof obj !== 'object' || obj === null) {
		return false;
	}

	const block = obj as Record<string, unknown>;

	// Check required fields
	if (!Array.isArray(block.code)) {
		return false;
	}

	if (!block.code.every(line => typeof line === 'string')) {
		return false;
	}

	if (typeof block.gridCoordinates !== 'object' || block.gridCoordinates === null) {
		return false;
	}

	const coords = block.gridCoordinates as Record<string, unknown>;
	if (typeof coords.x !== 'number' || typeof coords.y !== 'number') {
		return false;
	}

	return true;
}

/**
 * Parses clipboard text and determines if it's a valid multi-block payload or single-block text.
 *
 * @param clipboardText - The raw clipboard text
 * @returns Object with either multiBlock array or singleBlock text
 */
export function parseClipboardData(
	clipboardText: string
): { type: 'multi'; blocks: ClipboardCodeBlock[] } | { type: 'single'; text: string } {
	// Try to parse as JSON
	let parsed: unknown;
	try {
		parsed = JSON.parse(clipboardText);
	} catch {
		// Not valid JSON, treat as single-block text
		return { type: 'single', text: clipboardText };
	}

	// Check if it's an array with at least 2 elements
	if (!Array.isArray(parsed) || parsed.length < 2) {
		return { type: 'single', text: clipboardText };
	}

	// Check if every element matches the expected code block shape
	if (!parsed.every(isValidClipboardCodeBlock)) {
		return { type: 'single', text: clipboardText };
	}

	return { type: 'multi', blocks: parsed };
}
