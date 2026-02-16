import parseGroup from '../group/codeParser';

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

		// Check if code block has ; @group directive
		const hasGroup = parseGroup(codeBlock.code);

		if (hasGroup) {
			// Remove all ; @group directive lines
			codeBlock.code = codeBlock.code.filter(line => {
				const commentMatch = line.match(/^\s*;\s*@(\w+)/);
				return !(commentMatch && commentMatch[1] === 'group');
			});

			// Update lastUpdated to invalidate cache
			codeBlock.lastUpdated = Date.now();

			// Trigger store update to re-render only the specific code block
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
		}
	}

	events.on('removeFromGroupDirective', onRemoveFromGroupDirective);
}
