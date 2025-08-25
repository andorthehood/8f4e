// Import worklet as a URL and create blob manually
import workletUrl from '../../../../../audio-worklet-runtime/dist/index.js?url';
import { State } from '../../types';
import { EventDispatcher } from '../../../events';

export default function audioWorkletRuntime(state: State, events: EventDispatcher) {
	let audioContext: AudioContext | null = null;
	let audioWorklet: AudioWorkletNode | null = null;

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
		await audioContext.audioWorklet.addModule(workletUrl);
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
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				const source = audioContext.createMediaStreamSource(stream);
				source.connect(audioWorklet);
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
		events.off('mousedown', initAudioContext);

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
