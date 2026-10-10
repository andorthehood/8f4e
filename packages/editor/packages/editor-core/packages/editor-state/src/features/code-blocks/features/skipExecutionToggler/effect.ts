import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';

import type { StateManager } from '@8f4e/state-manager';
import { isSkipExecutionDirective } from '@8f4e/tokenizer';
import incrementCompilerInputRevision from '../../../program-compiler/incrementCompilerInputRevision';
import setSkipExecution from './setSkipExecution';

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

		// Set target code block for programmatic edit to avoid re-rendering all code blocks
		state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit = codeBlock;

		const skipExecution = !codeBlock.code.some(line => isSkipExecutionDirective(line));
		const result = setSkipExecution(codeBlock.code, skipExecution);
		codeBlock.code = result.code;

		// Update lastUpdated to invalidate cache
		codeBlock.lastUpdated = Date.now();

		// Trigger store update to re-render only the specific code block
		store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEdit', codeBlock);
		if (result.changed) {
			incrementCompilerInputRevision(store);
		}
	}

	events.on('toggleModuleSkipExecutionDirective', onToggleModuleSkipExecutionDirective);
}
