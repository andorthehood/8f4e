import { instructionParser, isSkipExecutionDirective } from '@8f4e/compiler/syntax';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

/**
 * Effect that handles toggling the #skipExecution directive in module code blocks.
 * Provides a context menu action to skip/unskip module execution.
 */
export default function skipExecutionToggler(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onToggleModuleSkipExecutionDirective({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Check if module has #skipExecution directive
		const hasDirective = codeBlock.code.some(line => isSkipExecutionDirective(line));

		if (hasDirective) {
			// Remove all #skipExecution directive lines
			codeBlock.code = codeBlock.code.filter(line => !isSkipExecutionDirective(line));
		} else {
			// Insert #skipExecution after module header (first line)
			// Find the module header line index
			const moduleHeaderIndex = codeBlock.code.findIndex(line => {
				const match = line.match(instructionParser);
				return match && match[1] === 'module';
			});

			if (moduleHeaderIndex !== -1) {
				// Insert directive after module header
				codeBlock.code.splice(moduleHeaderIndex + 1, 0, '#skipExecution');
			}
		}

		// Update lastUpdated to invalidate cache
		codeBlock.lastUpdated = Date.now();
		// Trigger store update to re-render
		store.set('graphicHelper.codeBlocks', [...state.graphicHelper.codeBlocks]);
	}

	events.on('toggleModuleSkipExecutionDirective', onToggleModuleSkipExecutionDirective);
}
