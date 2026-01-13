import type { ConfigSchema } from './types';

const runtimeSettingsSchema: ConfigSchema = {
	type: 'object',
	oneOf: [
		{
			// AudioWorkletRuntime - only this runtime can use audio buffers
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
		},
		{
			// WebWorkerMIDIRuntime - only this runtime can use MIDI fields
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
		},
		{
			// WebWorkerLogicRuntime and MainThreadLogicRuntime - no audio or MIDI buffers
			properties: {
				runtime: {
					type: 'string',
					enum: ['WebWorkerLogicRuntime', 'MainThreadLogicRuntime'],
				},
				sampleRate: { type: 'number' },
			},
			required: ['runtime'],
			additionalProperties: false,
		},
	],
};

const configSchema: ConfigSchema = {
	type: 'object',
	properties: {
		memorySizeBytes: { type: 'number' },
		selectedRuntime: { type: 'number' },
		runtimeSettings: {
			type: 'array',
			items: runtimeSettingsSchema,
		},
		disableAutoCompilation: { type: 'boolean' },
	},
	additionalProperties: false,
};

export default configSchema;
