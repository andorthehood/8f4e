import { StateManager } from '@8f4e/state-manager';

import { log, error } from '../impureHelpers/logger/logger';

import type { State, EventDispatcher, RuntimeType } from '../types';

// Re-export types for convenience
export type { RuntimeFactory, RuntimeType } from '../types';

export default async function runtime(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();

	let runtimeDestroyer: null | (() => void) = null;
	let onlineRuntime: null | string;
	let isInitializing = false;

	async function initOrDestroyOrUpdateRuntime() {
		if (isInitializing) {
			log(state, 'Runtime is already initializing, skipping...', 'Runtime');
			return;
		}

		const runtime = state.compiledConfig.runtimeSettings[state.compiledConfig.selectedRuntime];

		if (onlineRuntime === runtime.runtime) {
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

			log(state, `Requesting runtime: ${runtime.runtime}`, 'Runtime');
			const runtimeFactory = await state.callbacks.requestRuntime(runtime.runtime as RuntimeType);
			log(state, `Successfully loaded runtime: ${runtime.runtime}`, 'Runtime');

			if (typeof runtimeFactory !== 'function') {
				throw new Error(`Runtime ${runtime.runtime} callback did not return a valid factory function`);
			}

			runtimeDestroyer = runtimeFactory(store, events);
			onlineRuntime = runtime.runtime;
			log(state, `Successfully initialized runtime: ${runtime.runtime}`, 'Runtime');
		} catch (err) {
			console.error('Failed to initialize runtime:', err);
			error(state, `Failed to initialize runtime: ${err instanceof Error ? err.message : 'Unknown error'}`);
			throw new Error(
				`Failed to load runtime ${runtime.runtime}: ${err instanceof Error ? err.message : 'Unknown error'}`
			);
		} finally {
			isInitializing = false;
		}
	}

	store.subscribe('compiler.isCompiling', initOrDestroyOrUpdateRuntime);
}
