import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import deriveEntryOutlines from './deriveEntryOutlines';

export default function entryOutlines(store: StateManager<State>): void {
	const state = store.getState();

	function syncEntryOutlines(): void {
		store.set(
			'codeBlockRendering.entryOutlines',
			deriveEntryOutlines(state.codeBlockRendering.codeBlocks, state.viewport.vGrid * 8, state.viewport.hGrid * 4)
		);
	}

	store.subscribe('codeBlockRendering.codeBlocks', syncEntryOutlines);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', syncEntryOutlines);
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', syncEntryOutlines);
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger', syncEntryOutlines);
	store.subscribe(
		'codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code',
		syncEntryOutlines
	);

	syncEntryOutlines();
}
