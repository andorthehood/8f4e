// Import the types from the editor
// Note: Worker import is done at runtime by the host, not here
import { StateManager } from '@8f4e/state-manager';

import type { State, EventDispatcher, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

// Type definitions for Web MIDI API (since they're not available in worker context during build)
interface MIDIInput {
	addEventListener(type: string, listener: (event: Event) => void): void;
	removeEventListener(type: string, listener: (event: Event) => void): void;
}

interface MIDIAccess {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	outputs: ReadonlyMap<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	inputs: ReadonlyMap<string, any>;
}

interface MIDIMessageEvent extends Event {
	data: Uint8Array;
}

// WebWorker MIDI Runtime Factory
export function webWorkerMIDIRuntimeFactory(
	store: StateManager<State>,
	events: EventDispatcher,
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	WorkerConstructor: new () => Worker
) {
	const state = store.getState();
	let selectedInput: MIDIInput | null = null;
	let worker: Worker | undefined;

	function onMidiMessage(event: Event) {
		const midiEvent = event as MIDIMessageEvent;
		if (worker) {
			worker.postMessage({
				type: 'midimessage',
				payload: midiEvent.data,
			});
		}
	}

	function onMidiAccess(access: MIDIAccess) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		access.outputs.forEach((port: any) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			state.midi.outputs.push(port as any);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		access.inputs.forEach((port: any) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			state.midi.inputs.push(port as any);
			selectedInput = port;
		});

		if (selectedInput) {
			selectedInput.addEventListener('midimessage', onMidiMessage);
		}
	}

	async function onWorkerMessage({ data }: MessageEvent) {
		switch (data.type) {
			case 'midiMessage':
				if (data.payload.port && state.midi.outputs[data.payload.port - 1]) {
					state.midi.outputs[data.payload.port - 1].send(data.payload.message, data.payload.delay);
				}
				break;
			case 'initialized':
				events.dispatch('runtimeInitialized');
				break;
			case 'stats':
				state.runtime.stats = {
					timerPrecisionPercentage: data.payload.timerPrecisionPercentage,
					timeToExecuteLoopMs: data.payload.timeToExecuteLoopMs,
					timerDriftMs: data.payload.timerDriftMs,
					timerExpectedIntervalTimeMs: data.payload.timerExpectedIntervalTimeMs,
				};
				break;
		}
	}

	function syncCodeAndSettingsWithRuntime() {
		if (!worker) {
			return;
		}
		const memory = getMemory();
		if (!memory) {
			console.warn('[Runtime] Memory not yet created, skipping runtime init');
			return;
		}
		worker.postMessage({
			type: 'init',
			payload: {
				memoryRef: memory,
				sampleRate: state.compiledProjectConfig.runtimeSettings.sampleRate,
				codeBuffer: getCodeBuffer(),
				compiledModules: state.compiler.compiledModules,
			},
		});
	}

	worker = new WorkerConstructor();

	worker.addEventListener('message', onWorkerMessage);
	syncCodeAndSettingsWithRuntime();

	// @ts-expect-error - requestMIDIAccess not available in worker context during build
	navigator.requestMIDIAccess().then(onMidiAccess);
	store.subscribeToValue('compiler.isCompiling', false, syncCodeAndSettingsWithRuntime);

	return () => {
		store.unsubscribe('compiler.isCompiling', syncCodeAndSettingsWithRuntime);

		if (selectedInput) {
			selectedInput.removeEventListener('midimessage', onMidiMessage);
			selectedInput = null;
		}

		state.midi.inputs.length = 0;
		state.midi.outputs.length = 0;

		if (worker) {
			worker.removeEventListener('message', onWorkerMessage);
			worker.terminate();
			worker = undefined;
		}
	};
}

/**
 * Create a runtime definition with injected callbacks.
 * This allows the host to provide getCodeBuffer and getMemory implementations.
 */
export function createWebWorkerMIDIRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	WorkerConstructor: new () => Worker
): RuntimeRegistryEntry {
	return {
		id: 'WebWorkerMIDIRuntime',
		defaults: {
			runtime: 'WebWorkerMIDIRuntime',
			sampleRate: 50,
		},
		schema: {
			type: 'object',
			properties: {
				runtime: {
					type: 'string',
					enum: ['WebWorkerMIDIRuntime'],
				},
				sampleRate: { type: 'number' },
				midiNoteOutputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							portMemoryId: { type: 'string' },
							velocityMemoryId: { type: 'string' },
							noteOnOffMemoryId: { type: 'string' },
							noteMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				midiNoteInputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							portMemoryId: { type: 'string' },
							velocityMemoryId: { type: 'string' },
							noteOnOffMemoryId: { type: 'string' },
							noteMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				midiControlChangeOutputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							selectedCCMemoryId: { type: 'string' },
							valueMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				midiControlChangeInputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							selectedCCMemoryId: { type: 'string' },
							valueMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			return webWorkerMIDIRuntimeFactory(store, events, getCodeBuffer, getMemory, WorkerConstructor);
		},
	};
}
