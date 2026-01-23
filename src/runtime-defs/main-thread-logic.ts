/**
 * Main Thread Logic Runtime Definition
 * Factory, schema, and defaults for the Main Thread Logic Runtime
 */
import createMainThreadLogicRuntime from '@8f4e/runtime-main-thread-logic';
import { StateManager } from '@8f4e/state-manager';

import type { RuntimeRegistryEntry, State, EventDispatcher, JSONSchemaLike } from '@8f4e/editor';

export function createMainThreadLogicRuntimeDef(callbacks: {
	getCodeBuffer: () => Uint8Array;
	getMemory: () => WebAssembly.Memory | null;
}): RuntimeRegistryEntry {
	function mainThreadLogicRuntimeFactory(store: StateManager<State>, events: EventDispatcher) {
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
			const memory = callbacks.getMemory();
			if (!memory) {
				console.warn('[Runtime] Memory not yet created, skipping runtime init');
				return;
			}
			runtime.init(memory, state.compiledProjectConfig.runtimeSettings.sampleRate, callbacks.getCodeBuffer());
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
		factory: mainThreadLogicRuntimeFactory,
	};
}
