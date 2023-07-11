import workletBlobUrl from 'worklet:../../../../audio-worklet/dist/index.js';

import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function worklet(state: State, events: EventDispatcher) {
	let audioContext: AudioContext;
	let audioWorklet: AudioWorkletNode;

	function onInitRuntime() {
		if (audioWorklet && state.runtime.runner !== 'audioWorklet') {
			audioWorklet.disconnect();
		}

		if (!audioWorklet || state.runtime.runner !== 'audioWorklet') {
			return;
		}

		const audioModule = state.compiler.compiledModules.get('audioout');

		const addresses = {
			audioBufferWordAddress: audioModule?.memoryMap.get('buffer')?.wordAddress || 0,
			outputWordAddress: audioModule?.memoryMap.get('output')?.wordAddress || 0,
			channelWordAddress: audioModule?.memoryMap.get('channel')?.wordAddress || 0,
		};

		audioWorklet.port.postMessage({
			type: 'init',
			memoryRef: state.compiler.memoryRef,
			codeBuffer: state.compiler.codeBuffer,
			addresses,
		});
	}

	async function initAudioContext() {
		if (audioContext || state.runtime.runner !== 'audioWorklet') {
			return;
		}

		audioContext = new AudioContext({ sampleRate: state.project.sampleRate, latencyHint: 'playback' });
		await audioContext.audioWorklet.addModule(workletBlobUrl);
		audioWorklet = new AudioWorkletNode(audioContext, 'worklet', {
			outputChannelCount: [2],
			numberOfOutputs: 1,
		});

		audioWorklet.port.onmessage = function ({ data }) {
			switch (data.type) {
				case 'initialized':
					events.dispatch('runtimeInitialized', data.payload);
					break;
			}
		};
		audioWorklet.connect(audioContext.destination);
	}

	events.on('initRuntime', onInitRuntime);
	events.on('mousedown', initAudioContext);
}
