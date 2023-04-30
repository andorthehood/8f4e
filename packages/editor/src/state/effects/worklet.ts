import workletBlobUrl from 'worklet:../../../../audio-worklet/dist/index.js';
import compile from '@8f4e/compiler';

import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function worklet(state: State, events: EventDispatcher) {
	const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
	let audioContext: AudioContext;
	let audioWorklet: AudioWorkletNode;

	function onRecompile() {
		if (!audioWorklet || !state.compiler.sampleRate) {
			return;
		}

		const { codeBuffer, compiledModules, memoryAddressLookup } = compile(
			Array.from(state.graphicHelper.modules).map(module => {
				return { code: module.code };
			}),
			state.compiler.compilerOptions
		);

		state.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
		state.compiler.memoryBufferFloat = new Float32Array(memoryRef.buffer);
		state.compiler.memoryRef = memoryRef;
		state.compiler.memoryAddressLookup = memoryAddressLookup;
		state.compiler.isCompiling = false;
		state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);
		state.compiler.compiledModules = compiledModules;

		const audioModule = compiledModules.get('audioout');

		const addresses = {
			audioBufferWordAddress: audioModule?.memoryMap.get('buffer')?.wordAddress || 0,
			outputWordAddress: audioModule?.memoryMap.get('output')?.wordAddress || 0,
			channelWordAddress: audioModule?.memoryMap.get('channel')?.wordAddress || 0,
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

		audioContext = new AudioContext({ sampleRate: state.project.sampleRate || 3000, latencyHint: 'playback' });
		await audioContext.audioWorklet.addModule(workletBlobUrl);
		audioWorklet = new AudioWorkletNode(audioContext, 'worklet');
		audioWorklet.port.onmessage = function ({ data }) {
			switch (data.type) {
				case 'compilationDone':
					events.dispatch('compilationDone', data.payload);
					break;
				case 'audioWorkletReady':
					state.compiler.sampleRate = data.payload.sampleRate;
					onRecompile();
					events.dispatch('audioWorkletReady', data.payload);
			}
		};
		audioWorklet.connect(audioContext.destination);
	}

	events.on('buildOk', onRecompile);
	events.on('mousedown', initAudioContext);
}
