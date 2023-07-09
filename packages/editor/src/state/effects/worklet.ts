import workletBlobUrl from 'worklet:../../../../audio-worklet/dist/index.js';

import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function worklet(state: State, events: EventDispatcher) {
	let audioContext: AudioContext;
	let audioWorklet: AudioWorkletNode;

	function onRecompile() {
		if (!audioWorklet) {
			return;
		}

		const audioModule = state.compiler.compiledModules.get('audioout');

		const addresses = {
			audioBufferWordAddress: audioModule?.memoryMap.get('buffer')?.wordAddress || 0,
			outputWordAddress: audioModule?.memoryMap.get('output')?.wordAddress || 0,
			channelWordAddress: audioModule?.memoryMap.get('channel')?.wordAddress || 0,
		};

		audioWorklet.port.postMessage({
			type: 'recompile',
			memoryRef: state.compiler.memoryRef,
			codeBuffer: state.compiler.codeBuffer,
			addresses,
		});
	}

	async function initAudioContext() {
		if (audioContext) {
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
				case 'process':
					console.log('process');
					break;
				case 'compilationDone':
					events.dispatch('compilationDone', data.payload);
					break;
				case 'audioWorkletReady':
					onRecompile();
					events.dispatch('audioWorkletReady', data.payload);
					break;
			}
		};
		audioWorklet.connect(audioContext.destination);
	}

	events.on('buildOk', onRecompile);
	events.on('mousedown', initAudioContext);
}
