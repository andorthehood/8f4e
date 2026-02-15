import deriveFavorites from '../../code-blocks/features/favorites/deriveFavorites';

import type { MenuGenerator } from '~/types';

/**
 * Generates a submenu for favorited code blocks.
 *
 * Scans all code blocks for the ; @favorite directive and creates menu items
 * that allow jumping to each favorite. Menu items are labeled as "blockType id"
 * to provide context and handle ambiguous/duplicate IDs.
 *
 * If no favorites are found, shows a disabled placeholder item.
 *
 * @param state - The editor state
 * @returns Array of context menu items
 */
export const favoritesMenu: MenuGenerator = state => {
	const favorites = deriveFavorites(state.graphicHelper.codeBlocks);

	// If no favorites, show a disabled placeholder
	if (favorites.length === 0) {
		return [
			{
				title: 'No favorites',
				disabled: true,
			},
		];
	}

	// Create menu items for each favorite, labeled as "blockType id"
	return favorites.map(favorite => ({
		title: `${favorite.blockType} ${favorite.id}`,
		action: 'jumpToFavoriteCodeBlock',
		payload: {
			creationIndex: favorite.creationIndex,
			id: favorite.id,
		},
		close: true,
	}));
};
