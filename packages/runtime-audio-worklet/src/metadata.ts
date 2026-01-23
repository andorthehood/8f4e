/**
 * Runtime metadata for AudioWorklet Runtime
 * Exports ID, defaults, and schema that can be imported by hosts.
 * The factory is created at the host level since it requires host callbacks.
 */

export const runtimeId = 'AudioWorkletRuntime';

export const runtimeDefaults = {
	runtime: 'AudioWorkletRuntime' as const,
	sampleRate: 44100,
};

export const runtimeSchema = {
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
} as const;
