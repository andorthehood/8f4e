import workletBlobUrl from 'worklet:../../../../audio-worklet/dist/index.js';

import { State } from '../types';
import { EventDispatcher } from '../../events';
import { compilationDone } from '../mutators/compiler';

export default async function worklet(state: State, events: EventDispatcher) {
	console.log(workletBlobUrl);

	const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
	let audioContext: AudioContext;
	let audioWorklet: AudioWorkletNode;

	function onRecompile() {
		if (!audioWorklet) {
			return;
		}
		audioWorklet.port.postMessage({
			memoryRef,
			modules: state.project.modules,
			connections: state.project.connections,
		});
	}

	async function initAudioContext() {
		if (audioContext) {
			return;
		}

		audioContext = new AudioContext();
		await audioContext.audioWorklet.addModule(workletBlobUrl);
		audioWorklet = new AudioWorkletNode(audioContext, 'worklet');
		audioWorklet.port.onmessage = function ({ data }) {
			switch (data.type) {
				case 'compilationDone':
					compilationDone(state, data, memoryRef);
					events.dispatch('compilationDone');
					break;
			}
		};
		audioWorklet.connect(audioContext.destination);
		onRecompile();
	}

	events.on('buildOk', onRecompile);
	events.on('mousedown', initAudioContext);
}
