import { webWorkerLogicRuntime } from './runtime-web-worker-logic-factory';
import { mainThreadLogicRuntime } from './runtime-main-thread-logic-factory';
import { audioWorkletRuntime } from './runtime-audio-worklet-factory';
import { webWorkerMIDIRuntime } from './runtime-web-worker-midi-factory';

import type { RuntimeRegistry, JSONSchemaLike } from '@8f4e/editor';

/**
 * Default runtime ID for the application.
 * This is used as the fallback when no runtime is specified or when an unknown runtime is requested.
 */
export const DEFAULT_RUNTIME_ID = 'WebWorkerLogicRuntime';

/**
 * Runtime registry for the application.
 * Maps runtime IDs to their configuration entries including defaults, schemas, and factory functions.
 */
export const runtimeRegistry: RuntimeRegistry = {
	WebWorkerLogicRuntime: {
		id: 'WebWorkerLogicRuntime',
		defaults: {
			runtime: 'WebWorkerLogicRuntime',
			sampleRate: 50,
		},
		schema: {
			type: 'object',
			properties: {
				runtime: {
					type: 'string',
					enum: ['WebWorkerLogicRuntime'],
				},
				sampleRate: { type: 'number' },
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		factory: webWorkerLogicRuntime,
	},
	MainThreadLogicRuntime: {
		id: 'MainThreadLogicRuntime',
		defaults: {
			runtime: 'MainThreadLogicRuntime',
			sampleRate: 50,
		},
		schema: {
			type: 'object',
			properties: {
				runtime: {
					type: 'string',
					enum: ['MainThreadLogicRuntime'],
				},
				sampleRate: { type: 'number' },
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		factory: mainThreadLogicRuntime,
	},
	AudioWorkletRuntime: {
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
		factory: audioWorkletRuntime,
	},
	WebWorkerMIDIRuntime: {
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
		factory: webWorkerMIDIRuntime,
	},
};
