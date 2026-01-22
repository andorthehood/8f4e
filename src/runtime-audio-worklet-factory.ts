// Import the types from the editor
import audioWorkletUrl from '@8f4e/runtime-audio-worklet?url';
import { StateManager } from '@8f4e/state-manager';

import { getCodeBuffer, getMemory } from './compiler-callback';

import type { State, EventDispatcher } from '@8f4e/editor';
// Import the runtime dependencies

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
export function audioWorkletRuntime(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	let audioContext: AudioContext | null = null;
	let audioWorklet: AudioWorkletNode | null = null;
	let mediaStream: MediaStream | null = null;
	let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

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
			.map(({ memoryId, output, channel }) => {
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
			.filter(({ audioBufferWordAddress }) => typeof audioBufferWordAddress !== 'undefined');

		const audioInputBuffers = (runtime.audioInputBuffers || [])
			.map(({ memoryId, input, channel }) => {
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
			.filter(({ audioBufferWordAddress }) => typeof audioBufferWordAddress !== 'undefined');

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

		audioContext = new AudioContext({ sampleRate: runtime.sampleRate, latencyHint: 'interactive' });

		await audioContext.audioWorklet.addModule(audioWorkletUrl);
		audioWorklet = new AudioWorkletNode(audioContext, 'worklet', {
			outputChannelCount: [2],
			numberOfOutputs: 1,
			numberOfInputs: 1, // Specify the number of inputs
			channelCount: 1,
			channelCountMode: 'explicit',
		});

		audioWorklet.port.onmessage = function ({ data }) {
			switch (data.type) {
				case 'initialized':
					events.dispatch('runtimeInitialized', data.payload);
					break;
			}
		};

		if (runtime.audioInputBuffers) {
			try {
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
			mediaStream.getTracks().forEach(track => track.stop());
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
