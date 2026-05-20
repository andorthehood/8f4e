import createModule from './createModule';
class Main extends AudioWorkletProcessor {
	constructor(...args: ConstructorParameters<typeof AudioWorkletProcessor>) {
		super(...args);

		this.port.onmessage = async event => {
			if (event.data.type === 'init') {
				this.init(
					event.data.memoryRef,
					event.data.codeBuffer,
					event.data.audioOutputBuffers,
					event.data.audioInputBuffers
				);
			}
		};
	}

	async init(
		memoryRef: WebAssembly.Memory,
		codeBuffer: Uint8Array,
		audioOutputBuffers: { channel: number; output: number; audioBufferWordAddress: number }[],
		audioInputBuffers: { channel: number; input: number; audioBufferWordAddress: number }[]
	) {
		const { memoryBuffer, buffer } = await createModule(memoryRef, codeBuffer);

		this.audioOutputBuffers = audioOutputBuffers;
		this.audioInputBuffers = audioInputBuffers;

		this.buffer = buffer;
		this.memoryBuffer = memoryBuffer;

		this.port.postMessage({
			type: 'initialized',
			payload: {
				sampleRate,
			},
		});
	}

	buffer: CallableFunction = () => {
		return;
	};

	memoryBuffer: Float32Array = new Float32Array(128).fill(0);
	audioOutputBuffers = [] as { channel: number; output: number; audioBufferWordAddress: number }[];
	audioInputBuffers = [] as { channel: number; input: number; audioBufferWordAddress: number }[];
	audioBufferSize: number | undefined;

	static get parameterDescriptors() {
		return [{ name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 }];
	}

	private reportAudioBufferSize(inputs: Float32Array[][], outputs: Float32Array[][]) {
		const audioBufferSize = outputs[0]?.[0]?.length ?? inputs[0]?.[0]?.length;

		if (!audioBufferSize || audioBufferSize === this.audioBufferSize) {
			return;
		}

		this.audioBufferSize = audioBufferSize;
		this.port.postMessage({
			type: 'runtimeValues',
			payload: {
				audioBufferSize,
			},
		});
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][]) {
		this.reportAudioBufferSize(inputs, outputs);

		for (let i = 0; i < this.audioInputBuffers.length; i++) {
			const input = inputs[this.audioInputBuffers[i].input];
			if (!input) {
				continue;
			}

			const channel = input[this.audioInputBuffers[i].channel];
			if (!channel) {
				continue;
			}

			for (let j = 0; j < channel.length; j++) {
				this.memoryBuffer[j + this.audioInputBuffers[i].audioBufferWordAddress] = channel[j];
			}
		}

		this.buffer();

		for (let i = 0; i < this.audioOutputBuffers.length; i++) {
			const output = outputs[this.audioOutputBuffers[i].output];

			if (!output) {
				continue;
			}

			const channel = output[this.audioOutputBuffers[i].channel];

			if (!channel) {
				continue;
			}

			for (let j = 0; j < channel.length; j++) {
				channel[j] = this.memoryBuffer[j + this.audioOutputBuffers[i].audioBufferWordAddress];
			}
		}

		return true;
	}
}

registerProcessor('worklet', Main);
