import type { State } from '@8f4e/editor-state-types';

import type { StateManager } from '@8f4e/state-manager';
import { parseBlockDirectives } from '../../utils/parseBlockDirectives';

function updateParsedDirectivesForBlock(block: State['codeBlockRendering']['codeBlocks'][number] | undefined): void {
	if (!block) {
		return;
	}

	block.parsedDirectives = parseBlockDirectives(block.code);
}

export default function parsedDirectivesUpdater(store: StateManager<State>): void {
	function updateAllBlocks(): void {
		const state = store.getState();
		for (const block of state.codeBlockRendering.codeBlocks) {
			updateParsedDirectivesForBlock(block);
		}
	}

	store.subscribe('codeBlockRendering.codeBlocks', updateAllBlocks);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', () => {
		updateParsedDirectivesForBlock(store.getState().codeBlockRendering.selectedCodeBlock);
	});
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', () => {
		updateParsedDirectivesForBlock(store.getState().codeBlockRendering.selectedCodeBlockForProgrammaticEdit);
	});
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code', () => {
		updateParsedDirectivesForBlock(
			store.getState().codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger
		);
	});
}
