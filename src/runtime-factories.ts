// Import the types from the editor
import { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime dependencies
import audioWorkletUrl from '@8f4e/audio-worklet-runtime?url';
import WebWorkerLogicRuntime from '@8f4e/web-worker-logic-runtime?worker';
import WebWorkerMIDIRuntime from '@8f4e/web-worker-midi-runtime?worker';

// AudioWorklet Runtime Factory
export function audioWorkletRuntime(state: State, events: EventDispatcher) {
	let audioContext: AudioContext | null = null;
	let audioWorklet: AudioWorkletNode | null = null;
	let mediaStream: MediaStream | null = null;
	let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

	function syncCodeAndSettingsWithRuntime() {
		const runtime = state.project.runtimeSettings[state.project.selectedRuntime];

		if (runtime.runtime !== 'AudioWorkletRuntime' || !audioWorklet || !audioContext) {
			return;
		}

		const audioOutputBuffers = (runtime.audioOutputBuffers || [])
			.map(({ moduleId, memoryId, output, channel }) => {
				const audioModule = state.compiler.compiledModules.get(moduleId);
				const audioBufferWordAddress = audioModule?.memoryMap.get(memoryId)?.wordAlignedAddress;

				return {
					audioBufferWordAddress,
					output,
					channel,
				};
			})
			.filter(({ audioBufferWordAddress }) => typeof audioBufferWordAddress !== 'undefined');

		const audioInputBuffers = (runtime.audioInputBuffers || [])
			.map(({ moduleId, memoryId, input, channel }) => {
				const audioModule = state.compiler.compiledModules.get(moduleId);
				const audioBufferWordAddress = audioModule?.memoryMap.get(memoryId)?.wordAlignedAddress;

				return {
					audioBufferWordAddress,
					input,
					channel,
				};
			})
			.filter(({ audioBufferWordAddress }) => typeof audioBufferWordAddress !== 'undefined');

		if (audioWorklet) {
			audioWorklet.port.postMessage({
				type: 'init',
				memoryRef: state.compiler.memoryRef,
				codeBuffer: state.compiler.codeBuffer,
				audioOutputBuffers,
				audioInputBuffers,
			});
		}
	}

	async function initAudioContext() {
		const runtime = state.project.runtimeSettings[state.project.selectedRuntime];

		if (audioContext || runtime.runtime !== 'AudioWorkletRuntime') {
			return;
		}

		audioContext = new AudioContext({ sampleRate: runtime.sampleRate, latencyHint: 'interactive' });

		await audioContext.audioWorklet.addModule(audioWorkletUrl);
		audioWorklet = new AudioWorkletNode(audioContext, 'worklet', {
			outputChannelCount: [2],
			numberOfOutputs: 1,
			numberOfInputs: 1, // Specify the number of inputs
			channelCount: 1,
			channelCountMode: 'explicit',
		});

		audioWorklet.port.onmessage = function ({ data }) {
			switch (data.type) {
				case 'initialized':
					events.dispatch('runtimeInitialized', data.payload);
					break;
			}
		};

		if (runtime.audioInputBuffers) {
			try {
				mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
				mediaStreamSource.connect(audioWorklet);
			} catch (error) {
				console.error('Error accessing the microphone:', error);
			}
		}

		audioWorklet.connect(audioContext.destination);

		syncCodeAndSettingsWithRuntime();
	}

	events.on('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);
	events.on('mousedown', initAudioContext);

	return () => {
		events.off('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);
		events.off('mousedown', initAudioContext);

		// Stop media stream and disconnect source
		if (mediaStreamSource) {
			mediaStreamSource.disconnect();
			mediaStreamSource = null;
		}

		if (mediaStream) {
			mediaStream.getTracks().forEach(track => track.stop());
			mediaStream = null;
		}

		if (audioWorklet) {
			audioWorklet.disconnect();
			audioWorklet = null;
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
	};
}

// WebWorker Logic Runtime Factory
export function webWorkerLogicRuntime(state: State, events: EventDispatcher) {
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

// WebWorker MIDI Runtime Factory
export function webWorkerMIDIRuntime(state: State, events: EventDispatcher) {
	let selectedInput: MIDIInput | null = null;
	let worker: Worker | undefined;

	function onMidiMessage(event) {
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

	worker = new WebWorkerMIDIRuntime();

	worker.addEventListener('message', onWorkerMessage);
	syncCodeAndSettingsWithRuntime();

	navigator.requestMIDIAccess().then(onMidiAccess);
	events.on('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);

	return () => {
		events.off('syncCodeAndSettingsWithRuntime', syncCodeAndSettingsWithRuntime);

		if (selectedInput) {
			selectedInput.removeEventListener('midimessage', onMidiMessage);
			selectedInput = null;
		}

		// Clean up MIDI ports from global state
		state.midi.inputs.length = 0;
		state.midi.outputs.length = 0;

		if (worker) {
			worker.removeEventListener('message', onWorkerMessage);
			worker.terminate();
			worker = undefined;
		}
	};
}
