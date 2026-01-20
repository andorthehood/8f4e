// Import the types from the editor
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';
import { StateManager } from '@8f4e/state-manager';

import { getCodeBuffer, getMemory } from './compiler-callback';

import type { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime dependencies

// WebWorker Logic Runtime Factory
export function webWorkerLogicRuntime(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	let worker: Worker | undefined;

	async function onWorkerMessage({ data }: MessageEvent) {
		switch (data.type) {
			case 'initialized':
				events.dispatch('runtimeInitialized');
				break;
			case 'stats':
				state.runtime.stats = {
					timerPrecisionPercentage: data.payload.timerPrecisionPercentage,
					timeToExecuteLoopMs: data.payload.timeToExecuteLoopMs,
					timerDriftMs: data.payload.timerDriftMs,
					timerExpectedIntervalTimeMs: data.payload.timerExpectedIntervalTimeMs,
				};
				break;
		}
	}

	function syncCodeAndSettingsWithRuntime() {
		if (!worker) {
			return;
		}
		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}
		worker.postMessage({
			type: 'init',
			payload: {
				memoryRef: memory,
				sampleRate: state.compiledConfig.runtimeSettings.sampleRate,
				codeBuffer: getCodeBuffer(),
				compiledModules: state.compiler.compiledModules,
			},
		});
	}

	worker = new WebWorkerLogicRuntime();

	worker.addEventListener('message', onWorkerMessage);
	syncCodeAndSettingsWithRuntime();

	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);

	return () => {
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);
		if (worker) {
			worker.removeEventListener('message', onWorkerMessage);
			worker.terminate();
			worker = undefined;
		}
	};
}
