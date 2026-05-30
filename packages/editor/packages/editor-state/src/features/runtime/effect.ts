import { StateManager } from '@8f4e/state-manager';

import {
	collectRuntimeEditorConfigSchemaContributions,
	registerRuntimeSelectionEditorConfigValidator,
	resolveSelectedRuntimeId,
} from './editorConfig';

import { log, error } from '../logger/logger';

import type { State, EventDispatcher } from '@8f4e/editor-state-types';

export default async function runtime(store: StateManager<State>, events: EventDispatcher) {
	registerRuntimeSelectionEditorConfigValidator(store);

	const state = store.getState();

	let runtimeDestroyer: null | (() => void) = null;
	let onlineRuntime: null | string;
	let isInitializing = false;

	async function initOrDestroyOrUpdateRuntime() {
		if (isInitializing) {
			log(state, 'Runtime is already initializing, skipping...', 'Runtime');
			return;
		}

		const selectedRuntimeId = resolveSelectedRuntimeId(
			state.editorConfig.runtime,
			state.runtimeRegistry,
			state.defaultRuntimeId
		);
		const selectedRuntimeEntry = state.runtimeRegistry[selectedRuntimeId];

		if (onlineRuntime === selectedRuntimeId) {
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
			...collectRuntimeEditorConfigSchemaContributions(
				state.editorConfig.runtime,
				state.runtimeRegistry,
				state.defaultRuntimeId
			),
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
