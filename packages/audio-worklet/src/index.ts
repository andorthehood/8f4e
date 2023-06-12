import createModule from './createModule';
class Main extends AudioWorkletProcessor {
	constructor(...args) {
		// @ts-ignore
		super(...args);

		this.port.postMessage({
			type: 'audioWorkletReady',
			payload: {
				sampleRate,
			},
		});

		this.port.onmessage = async event => {
			if (event.data.type === 'recompile') {
				this.recompile(event.data.memoryRef, event.data.codeBuffer, event.data.addresses);
			}
		};
	}

	async recompile(
		memoryRef: WebAssembly.Memory,
		codeBuffer: Uint8Array,
		addresses: { audioBufferWordAddress: number; outputWordAddress: number; channelWordAddress: number }
	) {
		const { memoryBuffer, buffer, init } = await createModule(memoryRef, codeBuffer);
		init();

		this.audioBufferWordAddress = addresses.audioBufferWordAddress;
		this.outputWordAddress = addresses.outputWordAddress;
		this.channelWordAddress = addresses.channelWordAddress;

		this.buffer = buffer;
		this.memoryBuffer = memoryBuffer;

		this.port.postMessage({
			type: 'compilationDone',
			payload: {
				sampleRate,
			},
		});
	}

	buffer: CallableFunction = () => {
		return;
	};

	memoryBuffer = new Float32Array(128).fill(0);
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
			outputChannel[i] = this.memoryBuffer[i + this.audioBufferWordAddress];
		}

		return true;
	}
}

registerProcessor('worklet', Main);
