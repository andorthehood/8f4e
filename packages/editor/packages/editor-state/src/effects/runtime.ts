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
			log(state, '[Runtime] Runtime is already initializing, skipping...');
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
				log(state, `[Runtime] Destroying runtime: ${onlineRuntime}`);
				runtimeDestroyer();
				runtimeDestroyer = null;
				onlineRuntime = null;
			}

			log(state, `[Runtime] Requesting runtime: ${runtime.runtime}`);
			const runtimeFactory = await state.callbacks.requestRuntime(runtime.runtime as RuntimeType);
			log(state, `[Runtime] Successfully loaded runtime: ${runtime.runtime}`);

			if (typeof runtimeFactory !== 'function') {
				throw new Error(`Runtime ${runtime.runtime} callback did not return a valid factory function`);
			}

			runtimeDestroyer = runtimeFactory(state, events);
			onlineRuntime = runtime.runtime;
			log(state, `[Runtime] Successfully initialized runtime: ${runtime.runtime}`);
		} catch (err) {
			error(state, 'Failed to initialize runtime:', err);
			console.error('Failed to initialize runtime:', err);
			throw new Error(
				`Failed to load runtime ${runtime.runtime}: ${err instanceof Error ? err.message : 'Unknown error'}`
			);
		} finally {
			isInitializing = false;
		}
	}

	async function changeRuntime({ selectedRuntime }: { selectedRuntime: RuntimeType }) {
		if (isInitializing) {
			log(state, '[Runtime] Cannot change runtime while initialization is in progress');
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

	events.on('buildFinished', initRuntime);
	events.on('changeRuntime', changeRuntime);
}
