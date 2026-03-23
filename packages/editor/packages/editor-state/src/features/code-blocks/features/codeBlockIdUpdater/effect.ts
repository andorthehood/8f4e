import { getModuleId, getConstantsId } from '@8f4e/compiler/syntax';

import getCodeBlockId from '../../utils/getCodeBlockId';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State } from '~/types';

/**
 * Effect that keeps the `id` and `moduleId` fields in sync with code block contents.
 * Updates both fields when the selected code block's code changes, rather than
 * recomputing them on every graphic update cycle.
 */
export default function codeBlockIdUpdater(store: StateManager<State>): void {
	const state = store.getState();

	function updateCodeBlockId(codeBlock: CodeBlockGraphicData): void {
		const newId = getCodeBlockId(codeBlock.code);
		if (newId !== codeBlock.id) {
			codeBlock.id = newId;
		}

		const newModuleId = getModuleId(codeBlock.code) || getConstantsId(codeBlock.code) || undefined;
		if (newModuleId !== codeBlock.moduleId) {
			codeBlock.moduleId = newModuleId;
		}
	}

	function updateAllCodeBlockIds(): void {
		for (const codeBlock of state.graphicHelper.codeBlocks) {
			updateCodeBlockId(codeBlock);
		}
	}

	function onSelectedCodeBlockCodeChange(): void {
		if (state.graphicHelper.selectedCodeBlock) {
			updateCodeBlockId(state.graphicHelper.selectedCodeBlock);
		}
	}

	function onProgrammaticSelectedCodeBlockCodeChange(): void {
		const block = state.graphicHelper.selectedCodeBlockForProgrammaticEdit;
		if (block) {
			updateCodeBlockId(block);
		}
	}

	function onProgrammaticSelectedCodeBlockWithoutCompilerTriggerCodeChange(): void {
		const block = state.graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger;
		if (block) {
			updateCodeBlockId(block);
		}
	}

	store.subscribe('graphicHelper.codeBlocks', updateAllCodeBlockIds);
	store.subscribe('graphicHelper.selectedCodeBlock.code', onSelectedCodeBlockCodeChange);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', onProgrammaticSelectedCodeBlockCodeChange);
	store.subscribe(
		'graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code',
		onProgrammaticSelectedCodeBlockWithoutCompilerTriggerCodeChange
	);
}
