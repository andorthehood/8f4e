import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default function webWorkerLogicRuntime(state: State, events: EventDispatcher) {
	const workerUrl = new URL('../../../../../../packages/web-worker-logic-runtime/src/index.ts', import.meta.url);

	let worker: Worker | undefined;

	async function onWorkerMessage({ data }) {
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
				memoryRef: state.compiler.memoryRef,
				sampleRate: state.project.runtimeSettings[state.project.selectedRuntime].sampleRate,
				codeBuffer: state.compiler.codeBuffer,
				compiledModules: state.compiler.compiledModules,
			},
		});
	}

	worker = new Worker(workerUrl, {
		type: 'module',
	});

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
