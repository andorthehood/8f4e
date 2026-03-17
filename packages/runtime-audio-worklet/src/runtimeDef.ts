// Import the types from the editor
// Note: audioWorkletUrl is imported at runtime by the host, not here
import { StateManager } from '@8f4e/state-manager';

import { resolveAudioWorkletRouting } from './audioRouting';

import type { State, EventDispatcher, RuntimeRegistryEntry, JSONSchemaLike, AudioWorkletRuntime } from '@8f4e/editor';

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

	function syncCodeAndSettingsWithRuntime() {
		const audioRoutes = resolveAudioWorkletRouting(state.graphicHelper.codeBlocks);

		if (!audioWorklet || !audioContext) {
			return;
		}

		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}

		const audioOutputBuffers = audioRoutes.audioOutputs
			.map(({ moduleId, memoryId, output, channel }) => {
				const audioModule = state.compiler.compiledModules[moduleId];
				const audioBufferWordAddress = audioModule?.memoryMap[memoryId]?.wordAlignedAddress;
				return {
					audioBufferWordAddress,
					output,
					channel,
				};
			})
			.filter(
				({ audioBufferWordAddress }: { audioBufferWordAddress: number | undefined }) =>
					typeof audioBufferWordAddress !== 'undefined'
			);

		const audioInputBuffers = audioRoutes.audioInputs
			.map(({ moduleId, memoryId, input, channel }) => {
				const audioModule = state.compiler.compiledModules[moduleId];
				const audioBufferWordAddress = audioModule?.memoryMap[memoryId]?.wordAlignedAddress;
				return {
					audioBufferWordAddress,
					input,
					channel,
				};
			})
			.filter(
				({ audioBufferWordAddress }: { audioBufferWordAddress: number | undefined }) =>
					typeof audioBufferWordAddress !== 'undefined'
			);

		if (audioWorklet) {
			audioWorklet.port.postMessage({
				type: 'init',
				memoryRef: memory,
				codeBuffer: getCodeBuffer(),
				audioOutputBuffers,
				audioInputBuffers,
			});
		}
	}

	async function initAudioContext() {
		const runtime = state.compiledProjectConfig.runtimeSettings as AudioWorkletRuntime;

		if (audioContext) {
			return;
		}

		store.set('dialog', { ...state.dialog, show: false });

		// @ts-expect-error - AudioContext not available in worker context during build
		audioContext = new AudioContext({
			sampleRate: state.runtimeDirectives?.sampleRate ?? runtime.sampleRate,
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
			}
		};

		if (resolveAudioWorkletRouting(state.graphicHelper.codeBlocks).audioInputs.length > 0) {
			try {
				// @ts-expect-error - navigator.mediaDevices not available in worker context during build
				mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
				mediaStreamSource.connect(audioWorklet);
			} catch (error) {
				console.error('Error accessing the microphone:', error);
			}
		}

		audioWorklet.connect(audioContext.destination);

		syncCodeAndSettingsWithRuntime();
	}

	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);
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

	function onRuntimeDirectivesChanged() {
		if (!audioContext) {
			return;
		}
		const runtime = state.compiledProjectConfig.runtimeSettings as AudioWorkletRuntime;
		const desiredSampleRate = state.runtimeDirectives?.sampleRate ?? runtime.sampleRate;
		if (audioContext.sampleRate !== desiredSampleRate) {
			tearDownAudioContext();
			store.set('dialog', {
				...state.dialog,
				show: true,
				text: 'Sample rate changed. Click anywhere to restart audio playback at the new sample rate.',
				title: 'Audio Permission',
				buttons: [{ title: 'OK', action: 'close' }],
			});
			return;
		}

		syncCodeAndSettingsWithRuntime();
	}

	store.subscribe('runtimeDirectives', onRuntimeDirectivesChanged);

	if (!audioContext) {
		store.set('dialog', {
			...state.dialog,
			show: true,
			text: 'This project is using the AudioWorklet runtime, to start the program with audio playback, please click anywhere on the screen to continue.',
			title: 'Audio Permission',
			buttons: [{ title: 'OK', action: 'close' }],
		});
	}

	return () => {
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);
		store.unsubscribe('runtimeDirectives', onRuntimeDirectivesChanged);
		events.off('mousedown', initAudioContext);

		tearDownAudioContext();
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
		id: 'AudioWorkletRuntime',
		defaults: {
			sampleRate: 44100,
		},
		schema: {
			type: 'object',
			properties: {
				sampleRate: { type: 'number' },
			},
			additionalProperties: false,
		} as JSONSchemaLike,
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return audioWorkletRuntimeFactory(store, events, getCodeBuffer, getMemory, audioWorkletUrl);
		},
	};
}
