// Import the types from the editor
import { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime dependencies
import audioWorkletUrl from '@8f4e/audio-worklet-runtime?url';

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
