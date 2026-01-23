/**
 * Runtime metadata for WebWorker Logic Runtime
 * Exports ID, defaults, and schema that can be imported by hosts.
 * The factory is created at the host level since it requires host callbacks.
 */

export const runtimeId = 'WebWorkerLogicRuntime';

export const runtimeDefaults = {
	runtime: 'WebWorkerLogicRuntime' as const,
	sampleRate: 50,
};

export const runtimeSchema = {
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
} as const;
