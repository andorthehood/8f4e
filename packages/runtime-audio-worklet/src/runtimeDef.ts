// Import the types from the editor
// Note: audioWorkletUrl is imported at runtime by the host, not here
import { StateManager } from '@8f4e/state-manager';
import { resolveSchemaConfigRoot } from '@8f4e/editor';

import { AUDIO_WORKLET_RUNTIME_ID, storeAudioWorkletRuntimeValues } from './runtimeValues';

import type {
	EditorConfig,
	EditorConfigSchemaContribution,
	EventDispatcher,
	RuntimeRegistryEntry,
	State,
} from '@8f4e/editor';

const AUDIO_PERMISSION_DIALOG_ID = 'audio-worklet-permission';
const AUDIO_BUFFER_SIZE = 128;
const AUDIO_BUFFER_ADDRESS_SCHEMA = {
	format: 'memory-address',
	anyOf: [
		{ type: 'integer' as const, minimum: 0 },
		{ type: 'string' as const, pattern: '^[^:\\s]+:[^:\\s]+$' },
	],
};

const AUDIO_WORKLET_EDITOR_CONFIG: EditorConfigSchemaContribution = {
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

interface AudioWorkletRuntimeConfig {
	sampleRate: number;
	audioOutBufferLAddress?: number;
	audioOutBufferRAddress?: number;
	audioInBufferLAddress?: number;
}

type AudioBufferConfigKey = 'audioOutBufferLAddress' | 'audioOutBufferRAddress' | 'audioInBufferLAddress';

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

function getAudioWorkletRuntimeConfig(state: State): AudioWorkletRuntimeConfig {
	const config = resolveSchemaConfigRoot(AUDIO_WORKLET_EDITOR_CONFIG, state.editorConfig, state) as Record<
		string,
		unknown
	>;

	return {
		sampleRate: typeof config.sampleRate === 'number' ? config.sampleRate : 48000,
		audioOutBufferLAddress: getAudioBufferConfigValue(config, 'audioOutBufferLAddress'),
		audioOutBufferRAddress: getAudioBufferConfigValue(config, 'audioOutBufferRAddress'),
		audioInBufferLAddress: getAudioBufferConfigValue(config, 'audioInBufferLAddress'),
	};
}

function getAudioBufferConfigValue(config: Record<string, unknown>, key: AudioBufferConfigKey): number | undefined {
	const value = config[key];
	return typeof value === 'number' ? value : undefined;
}

function getSampleRate(editorConfig: EditorConfig): number {
	const config = resolveSchemaConfigRoot(AUDIO_WORKLET_EDITOR_CONFIG, editorConfig);
	return typeof config.sampleRate === 'number' ? config.sampleRate : 48000;
}

export function getAudioOutputBuffers(state: State): AudioOutputBufferRoute[] {
	const config = getAudioWorkletRuntimeConfig(state);
	const leftAddress = config.audioOutBufferLAddress;
	const rightAddress = config.audioOutBufferRAddress;
	const buffers: AudioOutputBufferRoute[] = [];

	if (leftAddress !== undefined) {
		buffers.push({ audioBufferWordAddress: leftAddress, output: 0, channel: 0 });
	}

	if (rightAddress !== undefined) {
		buffers.push({ audioBufferWordAddress: rightAddress, output: 0, channel: 1 });
	}

	return buffers;
}

export function getAudioInputBuffers(state: State): AudioInputBufferRoute[] {
	const config = getAudioWorkletRuntimeConfig(state);
	const leftAddress = config.audioInBufferLAddress;

	return leftAddress === undefined ? [] : [{ audioBufferWordAddress: leftAddress, input: 0, channel: 0 }];
}

function hasAudioInputBufferConfig(editorConfig: EditorConfig): boolean {
	return resolveSchemaConfigRoot(AUDIO_WORKLET_EDITOR_CONFIG, editorConfig).audioInBufferLAddress !== undefined;
}

// AudioWorklet Runtime Factory
export function audioWorkletRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	audioWorkletUrl: string
) {
	const state = store.getState();
	// Using any types for Web Audio API types that aren't available in worker context during build
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let audioContext: any | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let audioWorklet: any | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mediaStream: any | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mediaStreamSource: any | null = null;

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

	function syncCodeAndSettingsWithRuntime() {
		if (!audioWorklet || !audioContext) {
			return;
		}

		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}

		if (audioWorklet) {
			audioWorklet.port.postMessage({
				type: 'init',
				memoryRef: memory,
				codeBuffer: getCodeBuffer(),
				audioOutputBuffers: getAudioOutputBuffers(state),
				audioInputBuffers: getAudioInputBuffers(state),
			});
		}
	}

	async function syncAudioInputSource() {
		if (!audioContext || !audioWorklet) {
			return;
		}

		if (!hasAudioInputBufferConfig(state.editorConfig)) {
			if (mediaStreamSource) {
				mediaStreamSource.disconnect();
				mediaStreamSource = null;
			}

			if (mediaStream) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				mediaStream.getTracks().forEach((track: any) => track.stop());
				mediaStream = null;
			}
			return;
		}

		if (mediaStreamSource) {
			return;
		}

		try {
			// @ts-expect-error - navigator.mediaDevices not available in worker context during build
			mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
			mediaStreamSource.connect(audioWorklet);
		} catch (error) {
			console.error('Error accessing the microphone:', error);
		}
	}

	async function initAudioContext() {
		if (audioContext) {
			return;
		}
		hideAudioPermissionDialog();

		// @ts-expect-error - AudioContext not available in worker context during build
		audioContext = new AudioContext({
			sampleRate: getSampleRate(state.editorConfig),
			latencyHint: 'interactive',
		});

		await audioContext.audioWorklet.addModule(audioWorkletUrl);
		// @ts-expect-error - AudioWorkletNode not available in worker context during build
		audioWorklet = new AudioWorkletNode(audioContext, 'worklet', {
			outputChannelCount: [2],
			numberOfOutputs: 1,
			numberOfInputs: 1, // Specify the number of inputs
			channelCount: 1,
			channelCountMode: 'explicit',
		});

		audioWorklet.port.onmessage = function (event: { data: unknown }) {
			const { data } = event;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const typedData = data as any;
			switch (typedData.type) {
				case 'initialized':
					events.dispatch('runtimeInitialized', typedData.payload);
					break;
				case 'runtimeValues':
					storeAudioWorkletRuntimeValues(store, state, typedData.payload);
					break;
			}
		};

		await syncAudioInputSource();

		audioWorklet.connect(audioContext.destination);

		syncCodeAndSettingsWithRuntime();
	}

	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);
	store.subscribe('editorConfig.audioRuntime', onEditorConfigChanged);
	events.on('mousedown', initAudioContext);

	function tearDownAudioContext() {
		if (mediaStreamSource) {
			mediaStreamSource.disconnect();
			mediaStreamSource = null;
		}

		if (mediaStream) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			mediaStream.getTracks().forEach((track: any) => track.stop());
			mediaStream = null;
		}

		if (audioWorklet) {
			audioWorklet.disconnect();
			audioWorklet = null;
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
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
		syncCodeAndSettingsWithRuntime();
	}

	if (!audioContext) {
		showAudioPermissionDialog(
			'This project is using the AudioWorklet runtime, to start the program with audio playback, please click anywhere on the screen to continue.'
		);
	}

	return () => {
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);
		store.unsubscribe('editorConfig.audioRuntime', onEditorConfigChanged);
		events.off('mousedown', initAudioContext);

		tearDownAudioContext();
		hideAudioPermissionDialog();
	};
}

/**
 * Create a runtime definition with injected callbacks.
 * This allows the host to provide getCodeBuffer and getMemory implementations.
 */
export function createAudioWorkletRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	audioWorkletUrl: string
): RuntimeRegistryEntry {
	return {
		id: AUDIO_WORKLET_RUNTIME_ID,
		editorConfigSchema: AUDIO_WORKLET_EDITOR_CONFIG,
		getEnvConstants: editorConfig => [
			`const SAMPLE_RATE ${getSampleRate(editorConfig)}`,
			`const AUDIO_BUFFER_SIZE ${AUDIO_BUFFER_SIZE}`,
		],
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return audioWorkletRuntimeFactory(store, events, getCodeBuffer, getMemory, audioWorkletUrl);
		},
	};
}
