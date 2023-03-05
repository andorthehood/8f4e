import { State } from '../types';
import { EventDispatcher } from '../../events';

export default function worklet(state: State, events: EventDispatcher) {
	// const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
	let audioContext: AudioContext;

	async function initAudioContext() {
		if (audioContext) {
			return;
		}

		audioContext = new AudioContext();
		await audioContext.audioWorklet.addModule(new URL('../../../packages/audio-worklet/src/index.ts', import.meta.url));
		const noiseGenerator = new AudioWorkletNode(audioContext, 'worklet');
		noiseGenerator.connect(audioContext.destination);
	}

	// worker.addEventListener('message', onWorkerMessage);
	// events.on('createConnection', onRecompile);
	// events.on('deleteConnection', onRecompile);
	// events.on('addModule', onRecompile);
	// events.on('deleteModule', onRecompile);
	// events.on('init', onRecompile);
	events.on('mousedown', initAudioContext);
}
