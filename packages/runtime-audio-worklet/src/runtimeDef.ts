// Import the types from the editor
// Note: audioWorkletUrl is imported at runtime by the host, not here
import { StateManager } from '@8f4e/state-manager';

import type { State, EventDispatcher, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

/**
 * Resolves a memory identifier into module and memory name components.
 * Parses the unified format ('module.memory').
 * Parsing logic mirrors the approach used in resolveMemoryIdentifier for consistency.
 *
 * @param memoryId - Memory identifier in unified format 'module.memory'
 * @returns Object with moduleId and memoryName, or undefined if parsing fails
 */
function resolveAudioBufferMemory(memoryId: string): { moduleId: string; memoryName: string } | undefined {
	// Check if memoryId contains a dot (unified format: 'module.memory')
	// Use the same regex pattern as resolveMemoryIdentifier for consistency
	if (/(\S+)\.(\S+)/.test(memoryId)) {
		const moduleIdPart = memoryId.split('.')[0];
		const memoryNamePart = memoryId.split('.')[1];

		if (moduleIdPart && memoryNamePart) {
			return {
				moduleId: moduleIdPart,
				memoryName: memoryNamePart,
			};
		}
	}

	return undefined;
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

	function syncCodeAndSettingsWithRuntime() {
		const runtime = state.compiledProjectConfig.runtimeSettings;

		if (runtime.runtime !== 'AudioWorkletRuntime' || !audioWorklet || !audioContext) {
			return;
		}

		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}

		const audioOutputBuffers = (runtime.audioOutputBuffers || [])
			.map(({ memoryId, output, channel }: { memoryId: string; output: number; channel: number }) => {
				const resolved = resolveAudioBufferMemory(memoryId);
				if (!resolved) {
					return { audioBufferWordAddress: undefined, output, channel };
				}

				const audioModule = state.compiler.compiledModules[resolved.moduleId];
				const audioBufferWordAddress = audioModule?.memoryMap[resolved.memoryName]?.wordAlignedAddress;

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

		const audioInputBuffers = (runtime.audioInputBuffers || [])
			.map(({ memoryId, input, channel }: { memoryId: string; input: number; channel: number }) => {
				const resolved = resolveAudioBufferMemory(memoryId);
				if (!resolved) {
					return { audioBufferWordAddress: undefined, input, channel };
				}

				const audioModule = state.compiler.compiledModules[resolved.moduleId];
				const audioBufferWordAddress = audioModule?.memoryMap[resolved.memoryName]?.wordAlignedAddress;

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
		const runtime = state.compiledProjectConfig.runtimeSettings;

		if (audioContext || runtime.runtime !== 'AudioWorkletRuntime') {
			return;
		}

		store.set('dialog', { ...state.dialog, show: false });

		// @ts-expect-error - AudioContext not available in worker context during build
		audioContext = new AudioContext({ sampleRate: runtime.sampleRate, latencyHint: 'interactive' });

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

		if (runtime.audioInputBuffers) {
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
		events.off('mousedown', initAudioContext);

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
			runtime: 'AudioWorkletRuntime',
			sampleRate: 44100,
		},
		schema: {
			type: 'object',
			properties: {
				runtime: {
					type: 'string',
					enum: ['AudioWorkletRuntime'],
				},
				sampleRate: { type: 'number' },
				audioInputBuffers: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							memoryId: { type: 'string' },
							channel: { type: 'number' },
							input: { type: 'number' },
						},
						additionalProperties: false,
					},
				},
				audioOutputBuffers: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							memoryId: { type: 'string' },
							channel: { type: 'number' },
							output: { type: 'number' },
						},
						additionalProperties: false,
					},
				},
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return audioWorkletRuntimeFactory(store, events, getCodeBuffer, getMemory, audioWorkletUrl);
		},
	};
}
