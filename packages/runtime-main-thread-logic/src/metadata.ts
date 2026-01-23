/**
 * Runtime metadata for Main Thread Logic Runtime
 * Exports ID, defaults, and schema that can be imported by hosts.
 * The factory is created at the host level since it requires host callbacks.
 */

export const runtimeId = 'MainThreadLogicRuntime';

export const runtimeDefaults = {
	runtime: 'MainThreadLogicRuntime' as const,
	sampleRate: 50,
};

export const runtimeSchema = {
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
} as const;
