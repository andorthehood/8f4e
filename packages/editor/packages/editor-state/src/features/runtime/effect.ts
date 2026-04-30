import { StateManager } from '@8f4e/state-manager';

import { registerRuntimeEditorConfigValidator, resolveSelectedRuntimeId } from './editorConfig';

import { log, error } from '../logger/logger';

import type { State, EventDispatcher } from '@8f4e/editor-state-types';

export default async function runtime(store: StateManager<State>, events: EventDispatcher) {
	registerRuntimeEditorConfigValidator(store);

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

			// Get runtime from registry
			let runtimeFactory;
			if (selectedRuntimeId in state.runtimeRegistry) {
				const registryEntry = state.runtimeRegistry[selectedRuntimeId];
				runtimeFactory = registryEntry.factory;
				log(state, `Loaded runtime from registry: ${selectedRuntimeId}`, 'Runtime');
			} else {
				// Fall back to default runtime ID if unknown runtime requested
				const registryEntry = state.runtimeRegistry[state.defaultRuntimeId];
				runtimeFactory = registryEntry.factory;
				log(
					state,
					`Unknown runtime ${selectedRuntimeId}, falling back to default: ${state.defaultRuntimeId}`,
					'Runtime'
				);
			}

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

	function onRuntimeSelectionChanged() {
		if (state.compiler.isCompiling) {
			return;
		}

		void initOrDestroyOrUpdateRuntime();
	}

	store.subscribeToValue('compiler.isCompiling', false, initOrDestroyOrUpdateRuntime);
	store.subscribe('editorConfig.runtime', onRuntimeSelectionChanged);
}
