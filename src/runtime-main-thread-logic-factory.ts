// Import the types from the editor
import createMainThreadLogicRuntime from '@8f4e/runtime-main-thread-logic';

import type { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime

// Main Thread Logic Runtime Factory
export function mainThreadLogicRuntime(state: State, events: EventDispatcher) {
	let runtime: ReturnType<typeof createMainThreadLogicRuntime> | undefined;

	function onInitialized() {
		events.dispatch('runtimeInitialized');
	}

	function onStats(stats: { drift: number; timeToExecute: number }) {
		console.log(stats);
	}

	function onError(error: unknown) {
		console.error('Main thread runtime error:', error);
	}

	function syncCodeAndSettingsWithRuntime() {
		if (!runtime) {
			return;
		}
		runtime.init(
			state.compiler.memoryRef,
			state.compiler.runtimeSettings[state.compiler.selectedRuntime].sampleRate,
			state.compiler.codeBuffer
		);
	}

	runtime = createMainThreadLogicRuntime(onInitialized, onStats, onError);
	syncCodeAndSettingsWithRuntime();

	events.on('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);

	return () => {
		events.off('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);
		if (runtime) {
			runtime.stop();
			runtime = undefined;
		}
	};
}
