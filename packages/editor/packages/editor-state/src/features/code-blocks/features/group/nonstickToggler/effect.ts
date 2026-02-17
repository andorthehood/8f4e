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
			// Set target code block for programmatic edit
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit = block;

			// Update the @group directive line
			const groupLineIndex = block.code.findIndex(line => {
				const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
				return commentMatch && commentMatch[1] === 'group';
			});

			if (groupLineIndex !== -1) {
				const groupLine = block.code[groupLineIndex];
				const commentMatch = groupLine.match(/^\s*;\s*@(\w+)\s+(.*)/);

				if (commentMatch) {
					const args = commentMatch[2].trim();
					const tokens = args.split(/\s+/);
					const groupName = tokens[0];
					const currentlyHasNonstick = tokens.length > 1 && tokens[1] === 'nonstick';

					// Update the line based on target nonstick state
					let newLine: string;
					if (makeNonstick && !currentlyHasNonstick) {
						// Add nonstick
						newLine = groupLine.replace(/^\s*;\s*@group\s+\S+/, () => `; @group ${groupName} nonstick`);
					} else if (!makeNonstick && currentlyHasNonstick) {
						// Remove nonstick
						newLine = groupLine.replace(/^\s*;\s*@group\s+\S+\s+nonstick/, () => `; @group ${groupName}`);
					} else {
						// No change needed for this block
						continue;
					}

					block.code[groupLineIndex] = newLine;
				}
			}

			// Update lastUpdated to invalidate cache
			block.lastUpdated = Date.now();

			// Trigger store update to re-render the specific code block
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', block);
		}
	}

	events.on('toggleGroupNonstick', onToggleGroupNonstick);
}
