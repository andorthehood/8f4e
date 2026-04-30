// Import the types from the editor
import createMainThreadRuntime from '@8f4e/runtime-main-thread';
import { StateManager } from '@8f4e/state-manager';

import {
	getMainThreadRuntimeEnvConstantsFromBlocks,
	resolveMainThreadRuntimeDirectives,
	resolveMainThreadRuntimeDirectivesFromBlocks,
} from './runtimeDirectives';

import type { State, EventDispatcher, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

// Main Thread Runtime Factory
export function mainThreadRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
) {
	const state = store.getState();
	let runtime: ReturnType<typeof createMainThreadRuntime> | undefined;

	function onInitialized() {
		events.dispatch('runtimeInitialized');
	}

	function onStats(stats: {
		timerPrecisionPercentage: number;
		timeToExecuteLoopMs: number;
		timerDriftMs: number;
		timerExpectedIntervalTimeMs: number;
	}) {
		state.runtime.stats = {
			timerPrecisionPercentage: stats.timerPrecisionPercentage,
			timeToExecuteLoopMs: stats.timeToExecuteLoopMs,
			timerDriftMs: stats.timerDriftMs,
			timerExpectedIntervalTimeMs: stats.timerExpectedIntervalTimeMs,
		};
	}

	function onError(error: unknown) {
		console.error('Main thread runtime error:', error);
	}

	function syncCodeAndSettingsWithRuntime() {
		if (!runtime) {
			return;
		}
		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}
		const sampleRate = resolveMainThreadRuntimeDirectives(state).sampleRate;
		if (sampleRate === undefined) {
			return;
		}
		runtime.init(memory, sampleRate, getCodeBuffer());
	}

	runtime = createMainThreadRuntime(onInitialized, onStats, onError);
	syncCodeAndSettingsWithRuntime();

	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);

	return () => {
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);
		if (runtime) {
			runtime.stop();
			runtime = undefined;
		}
	};
}

/**
 * Create a runtime definition with injected callbacks.
 * This allows the host to provide getCodeBuffer and getMemory implementations.
 */
export function createMainThreadRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
): RuntimeRegistryEntry {
	return {
		id: 'MainThreadRuntime',
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
		resolveRuntimeDirectives: codeBlocks => resolveMainThreadRuntimeDirectivesFromBlocks(codeBlocks),
		getEnvConstants: codeBlocks => getMainThreadRuntimeEnvConstantsFromBlocks(codeBlocks),
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return mainThreadRuntimeFactory(store, events, getCodeBuffer, getMemory);
		},
	};
}
