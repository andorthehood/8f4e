import { StateManager } from '@8f4e/state-manager';

import getBlockType from '../../utils/codeParsers/getBlockType';

import type { CodeBlockGraphicData, State } from '~/types';

/**
 * Effect that keeps the blockType field in sync with code block contents.
 * Updates blockType when the selected code block's code changes.
 */
export default function blockTypeUpdater(store: StateManager<State>): void {
	const state = store.getState();

	/**
	 * Update blockType for a single code block
	 */
	function updateBlockType(codeBlock: CodeBlockGraphicData): void {
		codeBlock.blockType = getBlockType(codeBlock.code);
	}

	/**
	 * Update blockType for all code blocks
	 */
	function updateAllBlockTypes(): void {
		for (const codeBlock of state.graphicHelper.codeBlocks) {
			updateBlockType(codeBlock);
		}
	}

	/**
	 * Update blockType when the selected code block's code changes
	 */
	function onSelectedCodeBlockCodeChange(): void {
		if (state.graphicHelper.selectedCodeBlock) {
			updateBlockType(state.graphicHelper.selectedCodeBlock);
		}
	}

	function onProgrammaticSelectedCodeBlockCodeChange(): void {
		const block = state.graphicHelper.selectedCodeBlockForProgrammaticEdit;
		if (block) {
			updateBlockType(block);
		}
	}

	function onProgrammaticSelectedCodeBlockWithoutCompilerTriggerCodeChange(): void {
		const block = state.graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger;
		if (block) {
			updateBlockType(block);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', updateAllBlockTypes);
	store.subscribe('graphicHelper.selectedCodeBlock.code', onSelectedCodeBlockCodeChange);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', onProgrammaticSelectedCodeBlockCodeChange);
	store.subscribe(
		'graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code',
		onProgrammaticSelectedCodeBlockWithoutCompilerTriggerCodeChange
	);
}
