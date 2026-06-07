import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

import { error, log } from '../logger/logger';
import {
	collectRuntimeEditorConfigSchemaContributions,
	registerRuntimeSelectionEditorConfigValidator,
	resolveSelectedRuntimeId,
} from './editorConfig';

export default async function runtime(store: StateManager<State>, events: EventDispatcher) {
	registerRuntimeSelectionEditorConfigValidator(store);

	const state = store.getState();

	let runtimeDestroyer: null | (() => void) = null;
	let onlineRuntime: null | string = null;
	let isInitializing = false;

	async function initOrDestroyOrUpdateRuntime() {
		if (isInitializing) {
			log(state, 'Runtime is already initializing, skipping...', 'Runtime');
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
				log(state, `Destroying runtime: ${onlineRuntime}`, 'Runtime');
				runtimeDestroyer();
				runtimeDestroyer = null;
				onlineRuntime = null;
			}

			if (!selectedRuntimeId) {
				onlineRuntime = null;
				return;
			}

			const selectedRuntimeEntry = state.runtimeRegistry[selectedRuntimeId];
			log(state, `Requesting runtime: ${selectedRuntimeId}`, 'Runtime');

			const runtimeFactory = selectedRuntimeEntry.factory;
			log(state, `Loaded runtime from registry: ${selectedRuntimeId}`, 'Runtime');

			if (typeof runtimeFactory !== 'function') {
				throw new Error(`Runtime ${selectedRuntimeId} did not return a valid factory function`);
			}

			runtimeDestroyer = runtimeFactory(store, events);
			onlineRuntime = selectedRuntimeId;
			log(state, `Successfully initialized runtime: ${selectedRuntimeId}`, 'Runtime');
		} catch (err) {
			console.error('Failed to initialize runtime:', err);
			error(state, `Failed to initialize runtime: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
}
