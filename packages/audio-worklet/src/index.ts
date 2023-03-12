import { Connection, Module, setUpConnections } from '@8f4e/compiler';

import createModule from './createModule';
class Main extends AudioWorkletProcessor {
	constructor(...args) {
		// @ts-ignore
		super(...args);
		this.port.onmessage = async event => {
			this.recompile(event.data.memoryRef, event.data.modules, event.data.connections);
		};
	}

	async recompile(memoryRef: WebAssembly.Memory, modules: Module[], connections: Connection[]) {
		const { memoryBuffer, buffer, memoryAddressLookup, init, compiledModules } = await createModule(memoryRef, modules);

		init();
		setUpConnections(memoryBuffer, memoryAddressLookup, connections);

		const audioModule = compiledModules.get('audioout');

		if (!audioModule) {
			return;
		}

		this.audioBufferWordAddress = audioModule.memoryMap.get('buffer')?.wordAddress || 0;
		this.outputWordAddress = audioModule.memoryMap.get('output')?.wordAddress || 0;
		this.channelWordAddress = audioModule.memoryMap.get('channel')?.wordAddress || 0;
		this.buffer = buffer;
		this.memoryBuffer = memoryBuffer;

		this.buffer();

		this.port.postMessage({
			type: 'compilationDone',
			payload: {
				memoryAddressLookup: memoryAddressLookup,
				compiledModules: compiledModules,
			},
		});
	}

	buffer: CallableFunction = () => {
		return;
	};

	memoryBuffer = new Int32Array(128).fill(0);
	audioBufferWordAddress = 0;
	outputWordAddress = 0;
	channelWordAddress = 0;

	static get parameterDescriptors() {
		return [{ name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 }];
	}

	process(inputs, outputs, parameters) {
		this.buffer();
		const output = outputs[this.memoryBuffer[this.outputWordAddress]];

		if (!output) {
			return true;
		}

		const outputChannel = output[this.memoryBuffer[this.channelWordAddress]];

		if (!outputChannel) {
			return true;
		}

		for (let i = 0; i < outputChannel.length; i++) {
			outputChannel[i] = this.memoryBuffer[i + this.audioBufferWordAddress] / 500;
		}

		return true;
	}
}

registerProcessor('worklet', Main);
