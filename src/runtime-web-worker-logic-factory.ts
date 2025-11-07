// Import the types from the editor
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';

import type { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime dependencies

// WebWorker Logic Runtime Factory
export function webWorkerLogicRuntime(state: State, events: EventDispatcher) {
	let worker: Worker | undefined;

	async function onWorkerMessage({ data }: MessageEvent) {
		switch (data.type) {
			case 'initialized':
				events.dispatch('runtimeInitialized');
				break;
			case 'stats':
				console.log(data.payload);
				break;
		}
	}

	function syncCodeAndSettingsWithRuntime() {
		if (!worker) {
			return;
		}
		worker.postMessage({
			type: 'init',
			payload: {
				memoryRef: state.compiler.memoryRef as WebAssembly.Memory,
				sampleRate: state.compiler.runtimeSettings[state.compiler.selectedRuntime].sampleRate,
				codeBuffer: state.compiler.codeBuffer,
				compiledModules: state.compiler.compiledModules,
			},
		});
	}

	worker = new WebWorkerLogicRuntime();

	worker.addEventListener('message', onWorkerMessage);
	syncCodeAndSettingsWithRuntime();

	events.on('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);

	return () => {
		events.off('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);
		if (worker) {
			worker.removeEventListener('message', onWorkerMessage);
			worker.terminate();
			worker = undefined;
		}
	};
}
