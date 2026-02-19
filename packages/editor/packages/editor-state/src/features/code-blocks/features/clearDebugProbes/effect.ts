import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

/**
 * Checks if a line is a @debug directive.
 * Pattern: ; @debug <variable-name>
 */
function isDebugDirective(line: string): boolean {
	const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.+)/);
	return !!(commentMatch && commentMatch[1] === 'debug');
}

/**
 * Effect that handles clearing all @debug directives from a code block.
 * Provides a context menu action to remove all debug probes from the selected block.
 */
export default function clearDebugProbes(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onClearDebugProbes({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Set target code block for programmatic edit to avoid re-rendering all code blocks
		state.graphicHelper.selectedCodeBlockForProgrammaticEdit = codeBlock;

		// Remove all @debug directive lines
		codeBlock.code = codeBlock.code.filter(line => !isDebugDirective(line));

		// Update lastUpdated to invalidate cache
		codeBlock.lastUpdated = Date.now();

		// Trigger store update to re-render only the specific code block
		store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', codeBlock);
	}

	events.on('clearDebugProbes', onClearDebugProbes);
}
