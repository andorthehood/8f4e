import { Connection, Module, setUpConnections } from '@8f4e/compiler';

import createModule from './createModule';

async function recompile(memoryRef: WebAssembly.Memory, modules: Module[], connections: Connection[]) {
	const { memoryBuffer, buffer, memoryAddressLookup, init, compiledModules } = await createModule(memoryRef, modules);

	init();
	setUpConnections(memoryBuffer, memoryAddressLookup, connections);

	const audioModule = compiledModules.get('audioout');

	if (!audioModule) {
		return;
	}

	const audioBufferWordAddress = audioModule.memoryMap.get('buffer')?.wordAddress || 0;

	return { buffer, audioBufferWordAddress, memoryBuffer, memoryAddressLookup, compiledModules };
}

const _AudioWorkletProcessor = AudioWorkletProcessor || class Empty {};

class Main extends _AudioWorkletProcessor {
	constructor(...args) {
		// @ts-ignore
		super(...args);
		this.port.onmessage = async event => {
			const data = await recompile(event.data.memoryRef, event.data.modules, event.data.connections);

			if (data) {
				this.audioBufferWordAddress = data.audioBufferWordAddress;
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

	buffer: CallableFunction = () => {
		return;
	};

	memoryBuffer = new Int32Array(128).fill(0);
	audioBufferWordAddress = 0;

	static get parameterDescriptors() {
		return [{ name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 }];
	}

	process(inputs, outputs, parameters) {
		this.buffer();
		const output = outputs[0];
		const outputChannel = output[0];

		for (let i = 0; i < outputChannel.length; i++) {
			outputChannel[i] = this.memoryBuffer[i + this.audioBufferWordAddress] / 500;
		}

		return true;
	}
}

if (registerProcessor) {
	registerProcessor('worklet', Main);
}
