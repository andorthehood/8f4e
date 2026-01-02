import type { ConfigSchema } from './types';

const runtimeSettingsSchema: ConfigSchema = {
	type: 'object',
	properties: {
		runtime: {
			type: 'string',
			enum: ['WebWorkerLogicRuntime', 'MainThreadLogicRuntime', 'AudioWorkletRuntime', 'WebWorkerMIDIRuntime'],
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
	additionalProperties: false,
};

const configSchema: ConfigSchema = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		author: { type: 'string' },
		description: { type: 'string' },
		memorySizeBytes: { type: 'number' },
		selectedRuntime: { type: 'number' },
		runtimeSettings: {
			type: 'array',
			items: runtimeSettingsSchema,
		},
	},
	additionalProperties: false,
};

export default configSchema;
