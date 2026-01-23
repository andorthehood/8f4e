// Import the types from the editor
// Note: Worker import is done at runtime by the host, not here
import { StateManager } from '@8f4e/state-manager';

import type { State, EventDispatcher, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

// WebWorker Logic Runtime Factory
export function webWorkerLogicRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	WorkerConstructor: new () => Worker
) {
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
				sampleRate: state.compiledProjectConfig.runtimeSettings.sampleRate,
				codeBuffer: getCodeBuffer(),
				compiledModules: state.compiler.compiledModules,
			},
		});
	}

	worker = new WorkerConstructor();

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

/**
 * Create a runtime definition with injected callbacks.
 * This allows the host to provide getCodeBuffer and getMemory implementations.
 */
export function createWebWorkerLogicRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	WorkerConstructor: new () => Worker
): RuntimeRegistryEntry {
	return {
		id: 'WebWorkerLogicRuntime',
		defaults: {
			runtime: 'WebWorkerLogicRuntime',
			sampleRate: 50,
		},
		schema: {
			type: 'object',
			properties: {
				runtime: {
					type: 'string',
					enum: ['WebWorkerLogicRuntime'],
				},
				sampleRate: { type: 'number' },
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return webWorkerLogicRuntimeFactory(store, events, getCodeBuffer, getMemory, WorkerConstructor);
		},
	};
}
