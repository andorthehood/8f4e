import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { RuntimeRegistry } from './types';

/**
 * Default runtime settings schema for backward compatibility.
 * Used when no runtime registry is provided.
 */
const defaultRuntimeSettingsSchema: JSONSchemaLike = {
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

/**
 * Generates a runtime settings schema from a runtime registry.
 * Creates a discriminated union using oneOf based on the runtime field.
 */
function generateRuntimeSettingsSchema(runtimeRegistry: RuntimeRegistry): JSONSchemaLike {
	const oneOfBranches = Object.values(runtimeRegistry).map(entry => {
		// Ensure the schema has the runtime discriminator
		const schema = { ...entry.schema };
		if (schema.type === 'object' && schema.properties) {
			schema.properties = {
				...schema.properties,
				runtime: {
					type: 'string',
					enum: [entry.id],
				},
			};
		}
		return schema;
	});

	return {
		type: 'object',
		oneOf: oneOfBranches,
	};
}

/**
 * Generates the config schema, optionally using a runtime registry.
 * If a runtime registry is provided, generates runtime settings schema from the registry.
 * Otherwise, uses the default hardcoded runtime settings schema.
 */
export function getConfigSchema(runtimeRegistry?: RuntimeRegistry): JSONSchemaLike {
	const runtimeSettingsSchema = runtimeRegistry
		? generateRuntimeSettingsSchema(runtimeRegistry)
		: defaultRuntimeSettingsSchema;

	return {
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
}

/**
 * Default config schema for backward compatibility.
 * @deprecated Use getConfigSchema() instead to support runtime registry.
 * This will be removed in a future version once all consumers migrate to the registry approach.
 */
const configSchema: JSONSchemaLike = getConfigSchema();

export default configSchema;
