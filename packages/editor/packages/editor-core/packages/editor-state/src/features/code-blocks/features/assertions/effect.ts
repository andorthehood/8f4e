import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import deriveAssertionMarkers from './deriveAssertionMarkers';

export default function assertions(store: StateManager<State>): () => void {
	const state = store.getState();
	function refresh(): void {
		for (const block of state.codeBlockRendering.codeBlocks) {
			block.widgets.assertions = deriveAssertionMarkers(block, state);
		}
	}

	const selectors = ['runtime.values.TestRuntime', 'compiler.isCompiling', 'codeBlockRendering.codeBlocks'] as const;
	for (const selector of selectors) store.subscribe(selector, refresh);
	refresh();
	return () => {
		for (const selector of selectors) store.unsubscribe(selector, refresh);
	};
}
