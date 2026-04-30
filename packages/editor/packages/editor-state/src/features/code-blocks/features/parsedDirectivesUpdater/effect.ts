import { parseBlockDirectives } from '../../utils/parseBlockDirectives';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '@8f4e/editor-state-types';

function updateParsedDirectivesForBlock(block: State['graphicHelper']['codeBlocks'][number] | undefined): void {
	if (!block) {
		return;
	}

	block.parsedDirectives = parseBlockDirectives(block.code);
}

export default function parsedDirectivesUpdater(store: StateManager<State>): void {
	function updateAllBlocks(): void {
		const state = store.getState();
		for (const block of state.graphicHelper.codeBlocks) {
			updateParsedDirectivesForBlock(block);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', updateAllBlocks);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		updateParsedDirectivesForBlock(store.getState().graphicHelper.selectedCodeBlock);
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		updateParsedDirectivesForBlock(store.getState().graphicHelper.selectedCodeBlockForProgrammaticEdit);
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code', () => {
		updateParsedDirectivesForBlock(
			store.getState().graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger
		);
	});
}
