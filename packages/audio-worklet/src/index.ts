import { Connection, Module, setUpConnections } from '@8f4e/compiler';

import createModule from './createModule';
import resetMidi from './resetMidi';
import findMidiNoteModules from './findMidiNoteModules';
import broadcastMidiMessages from './broadcastMidiMessages';
import findMidiCCModules from './findMidiCCModules';
import broadcastMidiCCMessages from './broadcastMidiCCMessages';
import findRNBOModules from './findRNBOModules';
import broadcastRNBOMessages from './broadcastRNBOMessages';

async function recompile(memoryRef: WebAssembly.Memory, modules: Module[], connections: Connection[]) {
	const { memoryBuffer, buffer, memoryAddressLookup, init, compiledModules } = await createModule(memoryRef, modules);

	init();
	setUpConnections(memoryBuffer, memoryAddressLookup, connections);

	const audioModule = compiledModules.get('audioout');

	if (!audioModule) {
		return;
	}

	const audioBufferAddress = audioModule.memoryMap.get('buffer')?.wordAddress || 0;

	// clearInterval(interval);

	// const midiNoteModules = findMidiNoteModules(compiledModules, memoryAddressLookup);
	// const RNBOModules = findRNBOModules(compiledModules);
	// const midiCCModules = findMidiCCModules(compiledModules, memoryAddressLookup);

	// resetMidi();

	// interval = setInterval(() => {
	// 	cycle();
	// 	broadcastMidiCCMessages(midiCCModules, memoryBuffer);
	// 	broadcastMidiMessages(midiNoteModules, memoryBuffer);
	// 	broadcastRNBOMessages(RNBOModules, memoryBuffer);
	// }, intervalTime);

	return { buffer, audioBufferAddress, memoryBuffer, memoryAddressLookup, compiledModules };
}

class Main extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = async event => {
			const data = await recompile(event.data.memoryRef, event.data.modules, event.data.connections);

			if (data) {
				this.audioBufferAddress = data.audioBufferAddress;
				this.buffer = data.buffer;
				this.memoryBuffer = data.memoryBuffer;

				data.buffer();

				this.port.postMessage({
					type: 'compilationDone',
					payload: {
						memoryAddressLookup: data.memoryAddressLookup,
						compiledModules: data.compiledModules,
					},
				});
			}
		};
	}

	buffer() {
		return;
	}

	memoryBuffer = new Int32Array(128).fill(0);
	audioBufferAddress = 0;

	static get parameterDescriptors() {
		return [{ name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 }];
	}

	process(inputs, outputs, parameters) {
		this.buffer();
		const audioBuffer = this.memoryBuffer.slice(this.audioBufferAddress, this.audioBufferAddress + 128);
		const output = outputs[0];
		// const amplitude = parameters.amplitude;

		for (let channel = 0; channel < output.length; ++channel) {
			const outputChannel = output[channel];

			for (let i = 0; i < outputChannel.length; ++i) {
				outputChannel[i] = audioBuffer[i] / 500;
			}
		}

		return true;
	}
}

registerProcessor('worklet', Main);
