import { updateDirectiveArgs } from '../../directiveEditing';
import { getGroupBlocks } from '../getGroupBlocks';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '@8f4e/editor-state-types';

/**
 * Effect that handles toggling the nonstick flag for all code blocks in a group.
 * Provides context menu actions to make a group nonstick (single-block drag by default) or sticky (group drag by default).
 */
export default function groupNonstickToggler(store: StateManager<State>, events: EventDispatcher): void {
	function onToggleGroupNonstick({
		codeBlock,
		makeNonstick,
	}: {
		codeBlock: CodeBlockGraphicData;
		makeNonstick: boolean;
	}): void {
		const state = store.getState();

		if (!state.featureFlags.editing) {
			return;
		}

		// Only proceed if the code block has a group name
		if (!codeBlock.groupName) {
			return;
		}

		// Find all blocks in the same group
		const groupBlocks = getGroupBlocks(state.graphicHelper.codeBlocks, codeBlock.groupName);

		if (groupBlocks.length === 0) {
			return;
		}

		// Apply the nonstick change to all group blocks
		for (const block of groupBlocks) {
			// Compute updated code; updater returns args unchanged for a malformed ; @group with no group name
			const updatedCode = updateDirectiveArgs(block.code, 'group', args => {
				const [groupName] = args;
				if (!groupName) return args;
				return makeNonstick ? [groupName, 'nonstick'] : [groupName];
			});

			// Only apply and emit an update if any directive line actually changed
			if (updatedCode.every((line, i) => line === block.code[i])) continue;

			// Set target code block for programmatic edit
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit = block;

			block.code = updatedCode;

			// Update lastUpdated to invalidate cache
			block.lastUpdated = Date.now();

			// Trigger store update to re-render the specific code block
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', block);
		}
	}

	events.on('toggleGroupNonstick', onToggleGroupNonstick);
}
