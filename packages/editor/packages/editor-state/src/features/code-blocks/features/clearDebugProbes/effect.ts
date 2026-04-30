import { removeDirective } from '../directiveEditing';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '@8f4e/editor-state-types';

/**
 * Effect that handles clearing all @watch directives from a code block.
 * Provides a context menu action to remove all watch probes from the selected block.
 */
export default function clearDebugProbes(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onClearDebugProbes({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Set target code block for programmatic edit to avoid re-rendering all code blocks
		state.graphicHelper.selectedCodeBlockForProgrammaticEdit = codeBlock;

		// Remove all @watch directive lines
		codeBlock.code = removeDirective(codeBlock.code, 'watch');

		// Update lastUpdated to invalidate cache
		codeBlock.lastUpdated = Date.now();

		// Trigger store update to re-render only the specific code block
		store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	}

	events.on('clearDebugProbes', onClearDebugProbes);
}
