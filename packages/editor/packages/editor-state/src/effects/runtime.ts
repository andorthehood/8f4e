import type { State, EventDispatcher, RuntimeType } from '../types';

// Re-export types for convenience
export type { RuntimeFactory, RuntimeType } from '../types';

export default async function runtime(state: State, events: EventDispatcher) {
	let runtimeDestroyer: null | (() => void) = null;
	let onlineRuntime: null | string;
	let isInitializing = false;

	async function initRuntime() {
		// Prevent concurrent initialization
		if (isInitializing) {
			console.log('[Runtime] Runtime is already initializing, skipping...');
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
				console.log(`[Runtime] Destroying runtime: ${onlineRuntime}`);
				runtimeDestroyer();
				runtimeDestroyer = null;
				onlineRuntime = null;
			}

			console.log(`[Runtime] Requesting runtime: ${runtime.runtime}`);
			// Use the callback to request the runtime factory
			const runtimeFactory = await state.callbacks.requestRuntime(runtime.runtime as RuntimeType);
			console.log(`[Runtime] Successfully loaded runtime: ${runtime.runtime}`);

			// Validate that we got a function
			if (typeof runtimeFactory !== 'function') {
				throw new Error(`Runtime ${runtime.runtime} callback did not return a valid factory function`);
			}

			// Initialize the runtime
			runtimeDestroyer = runtimeFactory(state, events);
			onlineRuntime = runtime.runtime;
			console.log(`[Runtime] Successfully initialized runtime: ${runtime.runtime}`);
		} catch (error) {
			console.error('Failed to initialize runtime:', error);
			// Throw the error - no fallback mechanisms as per requirements
			throw new Error(
				`Failed to load runtime ${runtime.runtime}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			isInitializing = false;
		}
	}

	async function changeRuntime({ selectedRuntime }: { selectedRuntime: RuntimeType }) {
		// Prevent runtime changes during initialization
		if (isInitializing) {
			console.log('[Runtime] Cannot change runtime while initialization is in progress');
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
