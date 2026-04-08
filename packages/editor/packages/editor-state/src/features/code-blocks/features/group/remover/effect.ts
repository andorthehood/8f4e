import { removeDirective } from '../../directiveEditing';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

/**
 * Effect that handles removing the ; @group directive from code blocks.
 * Provides a context menu action to remove a block from its group.
 */
export default function groupRemover(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onRemoveFromGroupDirective({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Set target code block for programmatic edit to avoid re-rendering all code blocks
		state.graphicHelper.selectedCodeBlockForProgrammaticEdit = codeBlock;

		// Check if code block has a valid ; @group directive (reflected in derived groupName)
		if (codeBlock.groupName) {
			// Remove all ; @group directive lines
			codeBlock.code = removeDirective(codeBlock.code, 'group');

			// Update lastUpdated to invalidate cache
			codeBlock.lastUpdated = Date.now();

			// Trigger store update to re-render only the specific code block
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
		}
	}

	events.on('removeFromGroupDirective', onRemoveFromGroupDirective);
}
