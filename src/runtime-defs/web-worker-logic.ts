/**
 * WebWorker Logic Runtime Definition
 * Factory for the WebWorker Logic Runtime, combining package metadata with host-level factory.
 */
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';
import { runtimeId, runtimeDefaults, runtimeSchema } from '@8f4e/runtime-web-worker-logic';
import { StateManager } from '@8f4e/state-manager';

import type { RuntimeRegistryEntry, State, EventDispatcher } from '@8f4e/editor';

export function createWebWorkerLogicRuntimeDef(callbacks: {
	getCodeBuffer: () => Uint8Array;
	getMemory: () => WebAssembly.Memory | null;
}): RuntimeRegistryEntry {
	function webWorkerLogicRuntimeFactory(store: StateManager<State>, events: EventDispatcher) {
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
			const memory = callbacks.getMemory();
			if (!memory) {
				console.warn('[Runtime] Memory not yet created, skipping runtime init');
				return;
			}
			worker.postMessage({
				type: 'init',
				payload: {
					memoryRef: memory,
					sampleRate: state.compiledProjectConfig.runtimeSettings.sampleRate,
					codeBuffer: callbacks.getCodeBuffer(),
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

	return {
		id: runtimeId,
		defaults: runtimeDefaults,
		schema: runtimeSchema,
		factory: webWorkerLogicRuntimeFactory,
	};
}
