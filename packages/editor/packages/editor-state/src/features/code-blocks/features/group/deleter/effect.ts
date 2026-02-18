import { getGroupBlocks } from '../getGroupBlocks';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

/**
 * Effect that handles deleting all code blocks in a group.
 * Provides a context menu action to delete an entire group at once without confirmation.
 */
export default function groupDeleter(store: StateManager<State>, events: EventDispatcher): void {
	function onDeleteGroup({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		const state = store.getState();

		if (!state.featureFlags.editing) {
			return;
		}

		// Get the group name from the selected code block
		const groupName = codeBlock.groupName;

		if (!groupName) {
			return;
		}

		// Find all code blocks with the same group name
		const groupBlocks = getGroupBlocks(state.graphicHelper.codeBlocks, groupName);

		// Create a Set of blocks to delete for O(1) lookup
		const blocksToDelete = new Set(groupBlocks);

		// Filter out all blocks in the group
		const remainingBlocks = state.graphicHelper.codeBlocks.filter(block => !blocksToDelete.has(block));

		// Clear selected/dragged references if they point to deleted blocks
		if (state.graphicHelper.selectedCodeBlock && blocksToDelete.has(state.graphicHelper.selectedCodeBlock)) {
			state.graphicHelper.selectedCodeBlock = undefined;
		}

		if (state.graphicHelper.draggedCodeBlock && blocksToDelete.has(state.graphicHelper.draggedCodeBlock)) {
			state.graphicHelper.draggedCodeBlock = undefined;
		}

		// Clear programmatic selection if it points to a deleted block
		if (
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit &&
			blocksToDelete.has(state.graphicHelper.selectedCodeBlockForProgrammaticEdit)
		) {
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit = undefined;
		}

		// Clear non-compiler programmatic selection if it points to a deleted block
		if (
			state.graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger &&
			blocksToDelete.has(state.graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger)
		) {
			state.graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger = undefined;
		}

		// Update the code blocks array
		store.set('graphicHelper.codeBlocks', remainingBlocks);
	}

	events.on('deleteGroup', onDeleteGroup);
}
