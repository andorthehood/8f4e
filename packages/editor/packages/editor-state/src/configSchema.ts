import type { ConfigSchema } from './types';

const runtimeSettingsSchema: ConfigSchema = {
	type: 'object',
	properties: {
		runtime: {
			type: 'string',
			enum: ['WebWorkerLogicRuntime', 'MainThreadLogicRuntime', 'AudioWorkletRuntime', 'WebWorkerMIDIRuntime'],
		},
		sampleRate: { type: 'number' },
	},
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
};

export default configSchema;
