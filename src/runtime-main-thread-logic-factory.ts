// Import the types from the editor
import createMainThreadLogicRuntime from '@8f4e/runtime-main-thread-logic';
import { StateManager } from '@8f4e/state-manager';

import { getMemory } from './compiler-callback';

import type { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime

// Main Thread Logic Runtime Factory
export function mainThreadLogicRuntime(store: StateManager<State>, events: EventDispatcher) {
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
		runtime.init(
			memory,
			state.runtime.runtimeSettings[state.runtime.selectedRuntime].sampleRate,
			state.compiler.codeBuffer
		);
	}

	runtime = createMainThreadLogicRuntime(onInitialized, onStats, onError);
	syncCodeAndSettingsWithRuntime();

	store.subscribe('compiler.codeBuffer', syncCodeAndSettingsWithRuntime);

	return () => {
		store.unsubscribe('compiler.codeBuffer', syncCodeAndSettingsWithRuntime);
		if (runtime) {
			runtime.stop();
			runtime = undefined;
		}
	};
}
