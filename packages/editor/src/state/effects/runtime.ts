import { loadRuntime, RuntimeType } from './runtimes/registry';

import { EventDispatcher } from '../../events';
import { State, WebWorkerLogicRuntime, AudioWorkletRuntime, WebWorkerMIDIRuntime } from '../types';

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
