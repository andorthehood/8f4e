import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

import {
	collectRuntimeEditorConfigSchemaContributions,
	registerRuntimeSelectionEditorConfigValidator,
	resolveSelectedRuntimeId,
} from './editorConfig';

export default function runtime(store: StateManager<State>, events: EventDispatcher): () => void {
	registerRuntimeSelectionEditorConfigValidator(store);

	const state = store.getState();

	let runtimeDestroyer: null | (() => void) = null;
	let onlineRuntime: null | string = null;
	let isInitializing = false;
	let disposed = false;

	async function initOrDestroyOrUpdateRuntime() {
		if (disposed || isInitializing) {
			return;
		}

		const selectedRuntimeId = resolveSelectedRuntimeId(state.editorConfig.runtime, state.runtimeRegistry);
		const nextRuntimeId = selectedRuntimeId ?? null;

		if (onlineRuntime === nextRuntimeId) {
			return;
		}

		isInitializing = true;

		try {
			if (runtimeDestroyer) {
				runtimeDestroyer();
				runtimeDestroyer = null;
				onlineRuntime = null;
			}

			if (!selectedRuntimeId) {
				onlineRuntime = null;
				return;
			}

			const selectedRuntimeEntry = state.runtimeRegistry[selectedRuntimeId];
			const runtimeFactory = selectedRuntimeEntry.factory;

			if (typeof runtimeFactory !== 'function') {
				throw new Error(`Runtime ${selectedRuntimeId} did not return a valid factory function`);
			}

			runtimeDestroyer = runtimeFactory(store, events);
			onlineRuntime = selectedRuntimeId;
		} catch (err) {
			console.error('Failed to initialize runtime:', err);
			throw new Error(
				`Failed to load runtime ${selectedRuntimeId}: ${err instanceof Error ? err.message : 'Unknown error'}`
			);
		} finally {
			isInitializing = false;
		}
	}

	function syncRuntimeEditorConfigSchemaContributions() {
		const retainedContributions = Object.fromEntries(
			Object.entries(state.editorConfigSchemaContributions).filter(([id]) => !id.startsWith('runtime:'))
		);

		store.set('editorConfigSchemaContributions', {
			...retainedContributions,
			...collectRuntimeEditorConfigSchemaContributions(state.editorConfig.runtime, state.runtimeRegistry),
		});
	}

	function onRuntimeSelectionChanged() {
		if (disposed) {
			return;
		}

		syncRuntimeEditorConfigSchemaContributions();

		if (state.compiler.isCompiling) {
			return;
		}

		void initOrDestroyOrUpdateRuntime();
	}

	syncRuntimeEditorConfigSchemaContributions();
	store.subscribeToValue('compiler.isCompiling', false, initOrDestroyOrUpdateRuntime);
	store.subscribe('editorConfig.runtime', onRuntimeSelectionChanged);
	store.subscribe('runtimeRegistry', onRuntimeSelectionChanged);

	return () => {
		if (disposed) {
			return;
		}

		disposed = true;
		store.unsubscribe('compiler.isCompiling', initOrDestroyOrUpdateRuntime);
		store.unsubscribe('editorConfig.runtime', onRuntimeSelectionChanged);
		store.unsubscribe('runtimeRegistry', onRuntimeSelectionChanged);
		runtimeDestroyer?.();
		runtimeDestroyer = null;
		onlineRuntime = null;
	};
}
