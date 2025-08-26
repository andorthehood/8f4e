import { EventDispatcher } from '../../events';
import { State, WebWorkerLogicRuntime, AudioWorkletRuntime, WebWorkerMIDIRuntime } from '../types';

// Type for runtime factory function
export type RuntimeFactory = (state: State, events: EventDispatcher) => () => void;

// Runtime type union
export type RuntimeType =
	| WebWorkerLogicRuntime['runtime']
	| AudioWorkletRuntime['runtime']
	| WebWorkerMIDIRuntime['runtime'];

// Runtime registry mapping runtime types to their dynamic imports
const runtimeLoaders: Record<RuntimeType, () => Promise<{ default: RuntimeFactory }>> = {
	AudioWorkletRuntime: () => import('./runtimes/audioWorkletRuntime'),
	WebWorkerMIDIRuntime: () => import('./runtimes/webWorkerMIDIRuntime'),
	WebWorkerLogicRuntime: () => import('./runtimes/webWorkerLogicRuntime'),
};

/**
 * Loads a runtime factory function using dynamic imports
 * @param runtimeType The type of runtime to load
 * @returns Promise that resolves to the runtime factory function
 */
async function loadRuntime(runtimeType: RuntimeType): Promise<RuntimeFactory> {
	const loader = runtimeLoaders[runtimeType];
	if (!loader) {
		throw new Error(`Unknown runtime type: ${runtimeType}`);
	}

	try {
		// Dynamically import the runtime module
		const module = await loader();
		const factory = module.default;

		// Validate that we got a function
		if (typeof factory !== 'function') {
			throw new Error(`Runtime ${runtimeType} does not export a valid factory function`);
		}

		return factory;
	} catch (error) {
		throw new Error(
			`Failed to load runtime ${runtimeType}: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

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

		const runtime = state.project.runtimeSettings[state.project.selectedRuntime];

		if (onlineRuntime === runtime.runtime) {
			events.dispatch('syncCodeAndSettingsWithRuntime');
			return;
		}

		isInitializing = true;

		try {
			console.log(`[Runtime] Loading runtime: ${runtime.runtime}`);
			// Load the runtime factory using dynamic import
			const runtimeFactory = await loadRuntime(runtime.runtime as RuntimeType);
			console.log(`[Runtime] Successfully loaded runtime: ${runtime.runtime}`);

			// Initialize the runtime
			runtimeDestroyer = runtimeFactory(state, events);
			onlineRuntime = runtime.runtime;
			console.log(`[Runtime] Successfully initialized runtime: ${runtime.runtime}`);
		} catch (error) {
			console.error('Failed to initialize runtime:', error);
			// Could dispatch an error event here for UI handling
			// events.dispatch('runtimeLoadError', { error, runtimeType: runtime.runtime });
		} finally {
			isInitializing = false;
		}
	}

	async function changeRuntime({
		selectedRuntime,
	}: {
		selectedRuntime:
			| WebWorkerLogicRuntime['runtime']
			| AudioWorkletRuntime['runtime']
			| WebWorkerMIDIRuntime['runtime'];
	}) {
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

		const preSavedRuntime = state.project.runtimeSettings.findIndex(({ runtime }) => runtime === selectedRuntime);

		if (preSavedRuntime !== -1) {
			state.project.selectedRuntime = preSavedRuntime;
		} else {
			state.project.selectedRuntime =
				state.project.runtimeSettings.push({
					runtime: selectedRuntime,
					sampleRate: 50,
				}) - 1;
		}

		await initRuntime();
	}

	events.on('buildFinished', initRuntime);
	events.on('changeRuntime', changeRuntime);
}
