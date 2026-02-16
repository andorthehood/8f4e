import { instructionParser, isSkipExecutionDirective } from '@8f4e/compiler/syntax';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

/**
 * Effect that handles toggling the #skipExecution directive for all code blocks in a group.
 * Provides a context menu action to skip/unskip all modules in a group at once.
 */
export default function groupSkipExecutionToggler(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onToggleGroupSkipExecutionDirective({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Only proceed if the code block has a group name
		if (!codeBlock.groupName) {
			return;
		}

		// Find all module blocks in the same group
		const groupBlocks = state.graphicHelper.codeBlocks.filter(
			block => block.groupName === codeBlock.groupName && block.blockType === 'module'
		);

		if (groupBlocks.length === 0) {
			return;
		}

		// Check if all group blocks have #skipExecution directive
		const allSkipped = groupBlocks.every(block => block.code.some(line => isSkipExecutionDirective(line)));

		// Apply the same operation to all group blocks
		for (const block of groupBlocks) {
			// Set target code block for programmatic edit to avoid re-rendering all code blocks
			state.graphicHelper.selectedCodeBlockForProgrammaticEdit = block;

			if (allSkipped) {
				// Remove all #skipExecution directive lines
				block.code = block.code.filter(line => !isSkipExecutionDirective(line));
			} else {
				// Check if this specific block already has the directive
				const hasDirective = block.code.some(line => isSkipExecutionDirective(line));

				if (!hasDirective) {
					// Insert #skipExecution after module header (first line)
					const moduleHeaderIndex = block.code.findIndex(line => {
						const match = line.match(instructionParser);
						return match && match[1] === 'module';
					});

					if (moduleHeaderIndex !== -1) {
						// Insert directive after module header
						block.code.splice(moduleHeaderIndex + 1, 0, '#skipExecution');
					}
				}
			}

			// Update lastUpdated to invalidate cache
			block.lastUpdated = Date.now();

			// Trigger store update to re-render only the specific code block
			store.set('graphicHelper.selectedCodeBlockForProgrammaticEdit', block);
		}
	}

	events.on('toggleGroupSkipExecutionDirective', onToggleGroupSkipExecutionDirective);
}
