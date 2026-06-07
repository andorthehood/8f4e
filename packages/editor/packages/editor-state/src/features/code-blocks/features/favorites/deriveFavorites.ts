import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';

/**
 * Represents a favorite code block with its identifying metadata.
 */
export interface Favorite {
	/** Stable runtime identifier (primary key for resolution) */
	creationIndex: number;
	/** Human/source-facing block name. */
	name: string;
	/** Type of the code block */
	blockType: string;
}

/**
 * Derives favorite code blocks from the given code blocks array.
 *
 * This function collects all code blocks marked as favorites via the ; @favorite directive
 * and returns an array of favorite metadata. Favorites are deduplicated by
 * creationIndex to ensure each block appears at most once.
 *
 * @param codeBlocks - Array of code blocks to scan for favorites
 * @returns Array of favorite metadata, sorted by creationIndex
 *
 * @example
 * ```typescript
 * const favorites = deriveFavorites(state.codeBlockRendering.codeBlocks);
 * // Returns: [{ creationIndex: 5, name: 'osc', blockType: 'module' }, ...]
 * ```
 */
export default function deriveFavorites(codeBlocks: CodeBlockGraphicData[]): Favorite[] {
	const favorites: Favorite[] = [];
	const seenCreationIndices = new Set<number>();

	for (const block of codeBlocks) {
		// Skip blocks we've already seen (defensive deduplication)
		if (seenCreationIndices.has(block.creationIndex)) {
			continue;
		}

		// Check if this block has the @favorite directive
		if (block.isFavorite) {
			favorites.push({
				creationIndex: block.creationIndex,
				name: block.name,
				blockType: block.blockType,
			});
			seenCreationIndices.add(block.creationIndex);
		}
	}

	// Sort by creationIndex for consistent ordering
	return favorites.sort((a, b) => a.creationIndex - b.creationIndex);
}
