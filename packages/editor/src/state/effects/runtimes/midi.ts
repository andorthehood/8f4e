import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default async function midi(state: State, events: EventDispatcher): Promise<void> {
	let selectedInput: MIDIInput;
	let midiAccess: MIDIAccess;

	const workerUrl = new URL('../../../../../../packages/midi-worker/src/index.ts', import.meta.url);

	let worker: Worker | undefined;

	function onDestroyRuntimes() {
		if (worker) {
			worker.removeEventListener('message', onWorkerMessage);
			worker.terminate();
			worker = undefined;
		}
	}

	function onInitRuntime() {
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
				sampleRate: state.project.runtime.sampleRate,
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

	// Only init midi when the project has midi inputs or outputs.
	if (
		state.project.runtime.midiControlChangeInputs ||
		state.project.runtime.midiNoteInputs ||
		state.project.runtime.midiControlChangeOutputs ||
		state.project.runtime.midiNoteOutputs
	) {
		navigator.requestMIDIAccess().then(onMidiAccess);
	}

	events.on('initRuntime:WebWorker', onInitRuntime);
	events.on('destroyRuntimes', onDestroyRuntimes);
}
