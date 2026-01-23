// Import the types from the editor
import { StateManager } from '@8f4e/state-manager';

import createMainThreadLogicRuntime from './index';

import type { State, EventDispatcher, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

// Main Thread Logic Runtime Factory
export function mainThreadLogicRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
) {
	const state = store.getState();
	let runtime: ReturnType<typeof createMainThreadLogicRuntime> | undefined;

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
		runtime.init(memory, state.compiledProjectConfig.runtimeSettings.sampleRate, getCodeBuffer());
	}

	runtime = createMainThreadLogicRuntime(onInitialized, onStats, onError);
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
export function createMainThreadLogicRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
): RuntimeRegistryEntry {
	return {
		id: 'MainThreadLogicRuntime',
		defaults: {
			runtime: 'MainThreadLogicRuntime',
			sampleRate: 50,
		},
		schema: {
			type: 'object',
			properties: {
				runtime: {
					type: 'string',
					enum: ['MainThreadLogicRuntime'],
				},
				sampleRate: { type: 'number' },
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return mainThreadLogicRuntimeFactory(store, events, getCodeBuffer, getMemory);
		},
	};
}
