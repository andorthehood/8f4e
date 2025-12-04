import { log, error } from '../impureHelpers/logger';

import type { State, EventDispatcher, RuntimeType } from '../types';

// Re-export types for convenience
export type { RuntimeFactory, RuntimeType } from '../types';

export default async function runtime(state: State, events: EventDispatcher) {
	let runtimeDestroyer: null | (() => void) = null;
	let onlineRuntime: null | string;
	let isInitializing = false;

	async function initRuntime() {
		if (isInitializing) {
			log(state, 'Runtime is already initializing, skipping...', 'Runtime');
			return;
		}

		const runtime = state.compiler.runtimeSettings[state.compiler.selectedRuntime];

		if (onlineRuntime === runtime.runtime) {
			events.dispatch('syncCodeAndSettingsWithRuntime');
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

	async function changeRuntime({ selectedRuntime }: { selectedRuntime: RuntimeType }) {
		if (isInitializing) {
			log(state, 'Cannot change runtime while initialization is in progress', 'Runtime');
			return;
		}

		if (onlineRuntime === selectedRuntime) {
			return;
		}

		if (runtimeDestroyer) {
			runtimeDestroyer();
			runtimeDestroyer = null;
		}

		const preSavedRuntime = state.compiler.runtimeSettings.findIndex(({ runtime }) => runtime === selectedRuntime);

		if (preSavedRuntime !== -1) {
			state.compiler.selectedRuntime = preSavedRuntime;
		} else {
			state.compiler.selectedRuntime =
				state.compiler.runtimeSettings.push({
					runtime: selectedRuntime,
					sampleRate: 50,
				}) - 1;
		}

		await initRuntime();
	}

	events.on('compilationFinished', initRuntime);
	events.on('changeRuntime', changeRuntime);
}
