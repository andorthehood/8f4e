import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import deriveEntryOutlines from './deriveEntryOutlines';

export default function entryOutlines(store: StateManager<State>): void {
	const state = store.getState();

	function syncEntryOutlines(): void {
		store.set(
			'graphicHelper.entryOutlines',
			deriveEntryOutlines(state.graphicHelper.codeBlocks, state.viewport.vGrid * 8, state.viewport.hGrid * 4)
		);
	}

	store.subscribe('graphicHelper.codeBlocks', syncEntryOutlines);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncEntryOutlines);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', syncEntryOutlines);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger', syncEntryOutlines);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code', syncEntryOutlines);

	syncEntryOutlines();
}
