import workletBlobUrl from 'worklet:../../../../audio-worklet/dist/index.js';

import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function worklet(state: State, events: EventDispatcher) {
	let audioContext: AudioContext | null = null;
	let audioWorklet: AudioWorkletNode | null = null;

	function onInitRuntime() {
		const audioModule = state.compiler.compiledModules.get('audioout');

		const addresses = {
			audioBufferWordAddress: audioModule?.memoryMap.get('buffer')?.wordAddress || 0,
			outputWordAddress: audioModule?.memoryMap.get('output')?.wordAddress || 0,
			channelWordAddress: audioModule?.memoryMap.get('channel')?.wordAddress || 0,
		};

		if (audioWorklet) {
			audioWorklet.port.postMessage({
				type: 'init',
				memoryRef: state.compiler.memoryRef,
				codeBuffer: state.compiler.codeBuffer,
				addresses,
			});
		}
	}

	function onDestroyRuntimes() {
		if (audioWorklet) {
			audioWorklet.disconnect();
			audioWorklet = null;
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
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
		onInitRuntime();
	}

	events.on('initRuntime:AudioWorklet', onInitRuntime);
	events.on('destroyRuntimes', onDestroyRuntimes);
	events.on('mousedown', initAudioContext);
}
