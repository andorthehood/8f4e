import type { MenuGenerator } from '@8f4e/editor-state-types';
import deriveFavorites from '../../code-blocks/features/favorites/deriveFavorites';

/**
 * Generates a submenu for favorited code blocks.
 *
 * Scans all code blocks for the ; @favorite directive and creates menu items
 * that allow jumping to each favorite. Menu items are labeled as "blockType name"
 * to provide context.
 *
 * If no favorites are found, shows a disabled placeholder item.
 *
 * @param state - The editor state
 * @returns Array of context menu items
 */
export const favoritesMenu: MenuGenerator = state => {
	const favorites = deriveFavorites(state.codeBlockRendering.codeBlocks);

	// If no favorites, show a disabled placeholder
	if (favorites.length === 0) {
		return [
			{
				title: 'No favorites',
				disabled: true,
			},
		];
	}

	// Create menu items for each favorite, labeled as "blockType name"
	return favorites.map(favorite => ({
		title: `${favorite.blockType} ${favorite.name}`,
		action: 'jumpToFavoriteCodeBlock',
		payload: {
			creationIndex: favorite.creationIndex,
			name: favorite.name,
		},
		close: true,
	}));
};
