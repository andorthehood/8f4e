// Import the types from the editor
import WebWorkerMIDIRuntime from '@8f4e/runtime-web-worker-midi?worker';
import { StateManager } from '@8f4e/state-manager';

import { getCodeBuffer, getMemory } from './compiler-callback';

import type { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime dependencies

// WebWorker MIDI Runtime Factory
export function webWorkerMIDIRuntime(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	let selectedInput: MIDIInput | null = null;
	let worker: Worker | undefined;

	function onMidiMessage(event: MIDIMessageEvent) {
		if (worker) {
			worker.postMessage({
				type: 'midimessage',
				payload: event.data,
			});
		}
	}

	function onMidiAccess(access: MIDIAccess) {
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

	async function onWorkerMessage({ data }: MessageEvent) {
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
				state.runtime.stats = {
					timerPrecisionPercentage: data.payload.timerPrecisionPercentage,
					timeToExecuteLoopMs: data.payload.timeToExecuteLoopMs,
					timerDriftMs: data.payload.timerDriftMs,
					timerExpectedIntervalTimeMs: data.payload.timerExpectedIntervalTimeMs,
				};
				break;
		}
	}

	function syncCodeAndSettingsWithRuntime() {
		if (!worker) {
			return;
		}
		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}
		worker.postMessage({
			type: 'init',
			payload: {
				memoryRef: memory,
				sampleRate: state.compiledConfig.runtimeSettings[state.compiledConfig.selectedRuntime].sampleRate,
				codeBuffer: getCodeBuffer(),
				compiledModules: state.compiler.compiledModules,
			},
		});
	}

	worker = new WebWorkerMIDIRuntime();

	worker.addEventListener('message', onWorkerMessage);
	syncCodeAndSettingsWithRuntime();

	navigator.requestMIDIAccess().then(onMidiAccess);
	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);

	return () => {
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);

		if (selectedInput) {
			selectedInput.removeEventListener('midimessage', onMidiMessage);
			selectedInput = null;
		}

		state.midi.inputs.length = 0;
		state.midi.outputs.length = 0;

		if (worker) {
			worker.removeEventListener('message', onWorkerMessage);
			worker.terminate();
			worker = undefined;
		}
	};
}
