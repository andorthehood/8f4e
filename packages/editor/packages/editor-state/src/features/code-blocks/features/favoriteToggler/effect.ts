import parseFavorite from '../favorites/codeParser';
import removeDirective from '../../utils/removeDirective';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

/**
 * Effect that handles toggling the ; @favorite directive in code blocks.
 * Provides a context menu action to favorite/unfavorite any code block.
 */
export default function favoriteToggler(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onToggleFavoriteDirective({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Set target code block for programmatic edit to avoid re-rendering all code blocks
		state.graphicHelper.selectedCodeBlockForProgrammaticEdit = codeBlock;

		// Check if code block has ; @favorite directive
		const hasFavorite = parseFavorite(codeBlock.code);

		if (hasFavorite) {
			// Remove all ; @favorite directive lines
			codeBlock.code = removeDirective(codeBlock.code, 'favorite');
		} else {
			// Find the best position to insert the directive
			// For modules/functions/shaders, insert after the header line
			// For other block types, insert at the beginning
			let insertIndex = 0;

			// Look for header line (module, function, vertexShader, fragmentShader, etc.)
			const headerPatterns = [
				/^\s*module\s+/,
				/^\s*function\s+/,
				/^\s*vertexShader\s+/,
				/^\s*fragmentShader\s+/,
				/^\s*constants\s*$/,
				/^\s*config\s*$/,
			];

			for (let i = 0; i < codeBlock.code.length; i++) {
				const line = codeBlock.code[i];
				if (headerPatterns.some(pattern => pattern.test(line))) {
					insertIndex = i + 1;
					break;
				}
			}

			// Insert directive at the determined position
			codeBlock.code.splice(insertIndex, 0, '; @favorite');
		}

		// Update lastUpdated to invalidate cache
		codeBlock.lastUpdated = Date.now();

		// Trigger store update to re-render only the specific code block
		store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	}

	events.on('toggleFavoriteDirective', onToggleFavoriteDirective);
}
