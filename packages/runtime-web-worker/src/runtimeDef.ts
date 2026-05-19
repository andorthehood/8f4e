// Import the types from the editor
// Note: Worker import is done at runtime by the host, not here
import { StateManager } from '@8f4e/state-manager';

import {
	getWebWorkerRuntimeEnvConstantsFromBlocks,
	resolveWebWorkerRuntimeDirectives,
	resolveWebWorkerRuntimeDirectivesFromBlocks,
} from './runtimeDirectives';

import type { State, EventDispatcher, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

// WebWorker Runtime Factory
export function webWorkerRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	getMemoryRefsByRegion: () => Record<string, WebAssembly.Memory>,
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
				{
					const runtimeInfo = state.info.runtime ?? (state.info.runtime = {});
					runtimeInfo.timerPrecisionPercentage = data.payload.timerPrecisionPercentage;
					runtimeInfo.timeToExecuteLoopMs = data.payload.timeToExecuteLoopMs;
					runtimeInfo.timerDriftMs = data.payload.timerDriftMs;
					runtimeInfo.timerExpectedIntervalTimeMs = data.payload.timerExpectedIntervalTimeMs;
				}
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
		const sampleRate = resolveWebWorkerRuntimeDirectives(state).sampleRate;
		if (sampleRate === undefined) {
			return;
		}
		worker.postMessage({
			type: 'init',
			payload: {
				memoryRef: memory,
				memoryRefsByRegion: getMemoryRefsByRegion(),
				sampleRate,
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
export function createWebWorkerRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	WorkerConstructor: new () => Worker,
	getMemoryRefsByRegion: () => Record<string, WebAssembly.Memory> = () => ({})
): RuntimeRegistryEntry {
	return {
		id: 'WebWorkerRuntime',
		defaults: {
			sampleRate: 50,
		},
		schema: {
			type: 'object',
			properties: {
				sampleRate: { type: 'number' },
			},
			additionalProperties: false,
		} as JSONSchemaLike,
		resolveRuntimeDirectives: codeBlocks => resolveWebWorkerRuntimeDirectivesFromBlocks(codeBlocks),
		getEnvConstants: codeBlocks => getWebWorkerRuntimeEnvConstantsFromBlocks(codeBlocks),
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return webWorkerRuntimeFactory(store, events, getCodeBuffer, getMemory, getMemoryRefsByRegion, WorkerConstructor);
		},
	};
}
