import workletBlobUrl from 'worklet:../../../../audio-worklet/dist/index.js';
import compile, { setUpConnections } from '@8f4e/compiler';

import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function worklet(state: State, events: EventDispatcher) {
	console.log(workletBlobUrl);

	const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
	let audioContext: AudioContext;
	let audioWorklet: AudioWorkletNode;

	function onRecompile() {
		if (!audioWorklet) {
			return;
		}

		const { codeBuffer, compiledModules, memoryAddressLookup } = compile(state.project.modules);

		state.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
		state.compiler.memoryRef = memoryRef;
		state.compiler.memoryAddressLookup = memoryAddressLookup;
		state.compiler.isCompiling = false;
		state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);
		state.compiler.compiledModules = compiledModules;

		const audioModule = compiledModules.get('audioout');

		if (!audioModule) {
			return;
		}

		const addresses = {
			audioBufferWordAddress: audioModule.memoryMap.get('buffer')?.wordAddress || 0,
			outputWordAddress: audioModule.memoryMap.get('output')?.wordAddress || 0,
			channelWordAddress: audioModule.memoryMap.get('channel')?.wordAddress || 0,
		};

		audioWorklet.port.postMessage({
			memoryRef,
			codeBuffer,
			addresses,
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
					setUpConnections(state.compiler.memoryBuffer, state.compiler.memoryAddressLookup, state.project.connections);
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
