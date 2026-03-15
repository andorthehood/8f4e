import { updateDirectiveArgs } from '../../directiveEditing';
import { parseDirectiveComment } from '../../directives/utils';
import { getGroupBlocks } from '../getGroupBlocks';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

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
			// Check current nonstick state before applying the change
			const groupLine = block.code.find(line => parseDirectiveComment(line)?.name === 'group');
			if (!groupLine) continue;

			const parsed = parseDirectiveComment(groupLine)!;
			const [, ...flags] = parsed.args;
			const currentlyHasNonstick = flags.includes('nonstick');

			// Skip if already in target state
			if (makeNonstick === currentlyHasNonstick) continue;

			// Set target code block for programmatic edit
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit = block;

			// Update the @group directive args using the shared editing primitive
			block.code = updateDirectiveArgs(block.code, 'group', ([groupName]) =>
				makeNonstick ? [groupName, 'nonstick'] : [groupName]
			);

			// Update lastUpdated to invalidate cache
			block.lastUpdated = Date.now();

			// Trigger store update to re-render the specific code block
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', block);
		}
	}

	events.on('toggleGroupNonstick', onToggleGroupNonstick);
}
