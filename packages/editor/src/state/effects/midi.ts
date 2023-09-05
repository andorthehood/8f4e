import { EventDispatcher } from '../../events';
import { State } from '../types';

export default async function midi(state: State, events: EventDispatcher): Promise<void> {
	let selectedInput: MIDIInput;
	let midiAccess: MIDIAccess;

	const workerUrl = new URL('../../../../../packages/midi-worker/src/index.ts', import.meta.url);

	let worker: Worker | undefined;

	function onInitRuntime() {
		if (state.runtime.runner !== 'webWorker') {
			if (worker) {
				worker.removeEventListener('message', onWorkerMessage);
				worker.terminate();
				worker = undefined;
			}
			return;
		}

		if (!worker) {
			worker = new Worker(workerUrl, {
				type: 'module',
			});

			worker.addEventListener('message', onWorkerMessage);
		}

		worker.postMessage({
			type: 'init',
			payload: {
				memoryRef: state.compiler.memoryRef,
				sampleRate: state.project.sampleRate,
				codeBuffer: state.compiler.codeBuffer,
				compiledModules: state.compiler.compiledModules,
			},
		});
	}

	function onMidiMessage(event) {
		if (worker) {
			worker.postMessage({
				type: 'midimessage',
				payload: event.data,
			});
		}
	}

	function onMidiAccess(access: MIDIAccess) {
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
				if (data.payload.port && state.midi.outputs[data.payload.port]) {
					state.midi.outputs[data.payload.port - 1].send(data.payload.message, data.payload.delay);
				}
				break;
			case 'RNBOMessage':
				events.dispatch('RNBOMessage', data.payload);
				break;
			case 'initialized':
				events.dispatch('runtimeInitialized');
				break;
			case 'stats':
				console.log(data.payload);
				break;
		}
	}

	navigator.requestMIDIAccess().then(onMidiAccess);
	events.on('initRuntime', onInitRuntime);
}
