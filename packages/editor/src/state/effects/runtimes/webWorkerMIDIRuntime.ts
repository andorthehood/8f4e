import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default function webWorkerMIDIRuntime(state: State, events: EventDispatcher) {
	let selectedInput: MIDIInput;
	let midiAccess: MIDIAccess;

	const workerUrl = new URL('../../../../../../packages/web-worker-midi-runtime/src/index.ts', import.meta.url);

	let worker: Worker | undefined;

	function onMidiMessage(event) {
		if (worker) {
			worker.postMessage({
				type: 'midimessage',
				payload: event.data,
			});
		}
	}

	function onMidiAccess(access: any) {
		midiAccess = access;

		access.outputs.forEach(port => {
			state.midi.outputs.push(port);
		});

		access.inputs.forEach(port => {
			state.midi.inputs.push(port);
			selectedInput = port;
		});

		if (selectedInput) {
			selectedInput.addEventListener('midimessage', onMidiMessage);
		}
	}

	async function onWorkerMessage({ data }) {
		switch (data.type) {
			case 'midiMessage':
				if (data.payload.port && state.midi.outputs[data.payload.port - 1]) {
					state.midi.outputs[data.payload.port - 1].send(data.payload.message, data.payload.delay);
				}
				break;
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

	navigator.requestMIDIAccess().then(onMidiAccess);
	events.on('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);

	return () => {
		events.off('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);
		if (selectedInput) {
			selectedInput.removeEventListener('message', onMidiMessage);
		}
		if (worker) {
			worker.removeEventListener('message', onWorkerMessage);
			worker.terminate();
			worker = undefined;
		}
	};
}
