import type {
	EditorConfig,
	EditorConfigSchemaContribution,
	EventDispatcher,
	RuntimeRegistryEntry,
	State,
} from '@8f4e/editor';
import { resolveSchemaConfigRoot } from '@8f4e/editor';
import type { StateManager } from '@8f4e/state-manager';

const AUDIO_RUNTIME_ID = 'AudioWorkletRuntime';
const AUDIO_PERMISSION_DIALOG_ID = 'audio-worklet-permission';
const AUDIO_BUFFER_SIZE = 128;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 256;
const noop = () => {
	return;
};

const AUDIO_BUFFER_ADDRESS_SCHEMA = {
	format: 'memory-address',
	anyOf: [
		{ type: 'integer' as const, minimum: 0 },
		{ type: 'string' as const, pattern: '^[^:\\s]+:[^:\\s]+$' },
	],
};

const AUDIO_EDITOR_CONFIG: EditorConfigSchemaContribution = {
	root: 'audioRuntime',
	defaults: {
		sampleRate: 48000,
	},
	schema: {
		type: 'object',
		properties: {
			sampleRate: { type: 'number', minimum: 1 },
			audioOutBufferLAddress: AUDIO_BUFFER_ADDRESS_SCHEMA,
			audioOutBufferRAddress: AUDIO_BUFFER_ADDRESS_SCHEMA,
			audioInBufferLAddress: AUDIO_BUFFER_ADDRESS_SCHEMA,
		},
		additionalProperties: false,
	},
};

interface AudioRuntimeConfig {
	sampleRate: number;
	audioOutBufferLAddress?: number;
	audioOutBufferRAddress?: number;
	audioInBufferLAddress?: number;
}

interface AudioOutputBufferRoute {
	audioBufferWordAddress: number;
	output: number;
	channel: number;
}

interface AudioInputBufferRoute {
	audioBufferWordAddress: number;
	input: number;
	channel: number;
}

export function createScriptProcessorAudioRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
): RuntimeRegistryEntry {
	return {
		id: AUDIO_RUNTIME_ID,
		editorConfigSchema: AUDIO_EDITOR_CONFIG,
		getEnvConstants: editorConfig => [
			`const SAMPLE_RATE ${getSampleRate(editorConfig)}`,
			`const AUDIO_BUFFER_SIZE ${AUDIO_BUFFER_SIZE}`,
		],
		factory: (store, events) => scriptProcessorAudioRuntimeFactory(store, events, getCodeBuffer, getMemory),
	};
}

function scriptProcessorAudioRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null
) {
	const state = store.getState();
	let audioContext: AudioContext | null = null;
	let scriptProcessor: ScriptProcessorNode | null = null;
	let mediaStream: MediaStream | null = null;
	let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
	let memoryBuffer = new Float32Array(AUDIO_BUFFER_SIZE).fill(0);
	let bufferEntry: CallableFunction = noop;
	let syncToken = 0;
	let disposed = false;

	function showAudioPermissionDialog(text: string) {
		events.dispatch('addDialog', {
			id: AUDIO_PERMISSION_DIALOG_ID,
			text,
			title: 'Audio Permission',
			buttons: [{ title: 'OK', action: 'close' }],
		});
	}

	function hideAudioPermissionDialog() {
		events.dispatch('removeDialog', { id: AUDIO_PERMISSION_DIALOG_ID });
	}

	async function syncCodeAndSettingsWithRuntime() {
		if (!audioContext) {
			return;
		}

		const memory = getMemory();
		const codeBuffer = getCodeBuffer();
		const token = ++syncToken;

		if (!memory || codeBuffer.length === 0) {
			console.warn('[Runtime] Memory or code not yet created, skipping audio fallback runtime init');
			return;
		}

		try {
			const { instance } = (await WebAssembly.instantiate(codeBuffer, {
				host: {
					memory,
				},
			})) as unknown as { instance: WebAssembly.Instance };
			const nextBufferEntry =
				typeof instance.exports.buffer === 'function' ? (instance.exports.buffer as CallableFunction) : noop;
			if (disposed || token !== syncToken) {
				return;
			}

			memoryBuffer = new Float32Array(memory.buffer);
			bufferEntry = nextBufferEntry;
			storeAudioRuntimeValues(store, state, { audioBufferSize: AUDIO_BUFFER_SIZE });
			events.dispatch('runtimeInitialized', { sampleRate: audioContext.sampleRate });
		} catch (error) {
			console.error('Audio fallback runtime error:', error);
		}
	}

	async function syncAudioInputSource() {
		if (!audioContext || !scriptProcessor) {
			return;
		}

		if (!hasAudioInputBufferConfig(state.editorConfig)) {
			if (mediaStreamSource) {
				mediaStreamSource.disconnect();
				mediaStreamSource = null;
			}
			if (mediaStream) {
				mediaStream.getTracks().forEach(track => track.stop());
				mediaStream = null;
			}
			return;
		}

		if (mediaStreamSource) {
			return;
		}

		try {
			mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
			mediaStreamSource.connect(scriptProcessor);
		} catch (error) {
			console.error('Error accessing the microphone:', error);
		}
	}

	async function initAudioContext() {
		if (audioContext) {
			return;
		}
		hideAudioPermissionDialog();

		audioContext = new AudioContext({
			sampleRate: getSampleRate(state.editorConfig),
			latencyHint: 'interactive',
		});
		scriptProcessor = audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 2);
		scriptProcessor.onaudioprocess = processAudio;
		scriptProcessor.connect(audioContext.destination);

		await syncAudioInputSource();
		await syncCodeAndSettingsWithRuntime();
	}

	function processAudio(event: AudioProcessingEvent) {
		const input = event.inputBuffer;
		const output = event.outputBuffer;
		const inputBuffers = getAudioInputBuffers(state);
		const outputBuffers = getAudioOutputBuffers(state);

		for (let offset = 0; offset < output.length; offset += AUDIO_BUFFER_SIZE) {
			const chunkLength = Math.min(AUDIO_BUFFER_SIZE, output.length - offset);
			copyInputsToMemory(input, inputBuffers, offset, chunkLength);
			bufferEntry();
			copyMemoryToOutputs(output, outputBuffers, offset, chunkLength);
		}
	}

	function copyInputsToMemory(
		input: AudioBuffer,
		inputBuffers: AudioInputBufferRoute[],
		offset: number,
		chunkLength: number
	) {
		for (const route of inputBuffers) {
			if (route.channel >= input.numberOfChannels) {
				continue;
			}
			const channel = input.getChannelData(route.channel);
			for (let index = 0; index < chunkLength; index += 1) {
				memoryBuffer[route.audioBufferWordAddress + index] = channel[offset + index] ?? 0;
			}
		}
	}

	function copyMemoryToOutputs(
		output: AudioBuffer,
		outputBuffers: AudioOutputBufferRoute[],
		offset: number,
		chunkLength: number
	) {
		for (const route of outputBuffers) {
			if (route.channel >= output.numberOfChannels) {
				continue;
			}
			const channel = output.getChannelData(route.channel);
			for (let index = 0; index < chunkLength; index += 1) {
				channel[offset + index] = memoryBuffer[route.audioBufferWordAddress + index] ?? 0;
			}
		}
	}

	function tearDownAudioContext() {
		if (mediaStreamSource) {
			mediaStreamSource.disconnect();
			mediaStreamSource = null;
		}
		if (mediaStream) {
			mediaStream.getTracks().forEach(track => track.stop());
			mediaStream = null;
		}
		if (scriptProcessor) {
			scriptProcessor.disconnect();
			scriptProcessor.onaudioprocess = null;
			scriptProcessor = null;
		}
		if (audioContext) {
			void audioContext.close();
			audioContext = null;
		}
		bufferEntry = noop;
	}

	function onEditorConfigChanged() {
		if (!audioContext) {
			return;
		}
		const desiredSampleRate = getSampleRate(state.editorConfig);
		if (audioContext.sampleRate !== desiredSampleRate) {
			tearDownAudioContext();
			showAudioPermissionDialog(
				'Sample rate changed. Click anywhere to restart audio playback at the new sample rate.'
			);
			return;
		}

		void syncAudioInputSource();
		void syncCodeAndSettingsWithRuntime();
	}

	showAudioPermissionDialog(
		'This project is using the AudioWorklet runtime, to start the program with audio playback, please click anywhere on the screen to continue.'
	);

	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);
	store.subscribe('editorConfig.audioRuntime', onEditorConfigChanged);
	events.on('mousedown', initAudioContext);

	return () => {
		disposed = true;
		syncToken += 1;
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);
		store.unsubscribe('editorConfig.audioRuntime', onEditorConfigChanged);
		events.off('mousedown', initAudioContext);
		tearDownAudioContext();
		hideAudioPermissionDialog();
	};
}

function getAudioRuntimeConfig(editorConfig: EditorConfig, state?: State): AudioRuntimeConfig {
	const config = resolveSchemaConfigRoot(AUDIO_EDITOR_CONFIG, editorConfig, state) as Record<string, unknown>;

	return {
		sampleRate: typeof config.sampleRate === 'number' ? config.sampleRate : 48000,
		audioOutBufferLAddress: getAudioBufferConfigValue(config, 'audioOutBufferLAddress'),
		audioOutBufferRAddress: getAudioBufferConfigValue(config, 'audioOutBufferRAddress'),
		audioInBufferLAddress: getAudioBufferConfigValue(config, 'audioInBufferLAddress'),
	};
}

function getAudioBufferConfigValue(config: Record<string, unknown>, key: keyof AudioRuntimeConfig): number | undefined {
	const value = config[key];
	return typeof value === 'number' ? value : undefined;
}

function getSampleRate(editorConfig: EditorConfig): number {
	return getAudioRuntimeConfig(editorConfig).sampleRate;
}

function hasAudioInputBufferConfig(editorConfig: EditorConfig): boolean {
	return getAudioRuntimeConfig(editorConfig).audioInBufferLAddress !== undefined;
}

function getAudioOutputBuffers(state: State): AudioOutputBufferRoute[] {
	const config = getAudioRuntimeConfig(state.editorConfig, state);
	const buffers: AudioOutputBufferRoute[] = [];

	if (config.audioOutBufferLAddress !== undefined) {
		buffers.push({ audioBufferWordAddress: config.audioOutBufferLAddress, output: 0, channel: 0 });
	}
	if (config.audioOutBufferRAddress !== undefined) {
		buffers.push({ audioBufferWordAddress: config.audioOutBufferRAddress, output: 0, channel: 1 });
	}

	return buffers;
}

function getAudioInputBuffers(state: State): AudioInputBufferRoute[] {
	const config = getAudioRuntimeConfig(state.editorConfig, state);
	return config.audioInBufferLAddress === undefined
		? []
		: [{ audioBufferWordAddress: config.audioInBufferLAddress, input: 0, channel: 0 }];
}

function storeAudioRuntimeValues(store: StateManager<State>, state: State, values: Record<string, unknown>) {
	store.set('runtime.values', {
		...state.runtime.values,
		[AUDIO_RUNTIME_ID]: {
			...(state.runtime.values[AUDIO_RUNTIME_ID] ?? {}),
			...values,
		},
	});
}
