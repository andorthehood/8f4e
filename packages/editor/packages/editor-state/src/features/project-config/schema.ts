import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { RuntimeRegistry } from '~/types';

/**
 * Generates a runtime settings schema from a runtime registry.
 * Creates a discriminated union using oneOf based on the runtime field.
 */
function generateRuntimeSettingsSchema(runtimeRegistry: RuntimeRegistry): JSONSchemaLike {
	const oneOfBranches = Object.values(runtimeRegistry).map(entry => {
		// Ensure the schema has the runtime discriminator without mutating the original schema
		const schema = { ...entry.schema };
		if (schema.type === 'object' && schema.properties) {
			return {
				...schema,
				properties: {
					...schema.properties,
					runtime: {
						type: 'string' as const,
						enum: [entry.id] as const,
					},
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
 * Generates the config schema.
 */
export function getProjectConfigSchema(runtimeRegistry: RuntimeRegistry): JSONSchemaLike {
	const runtimeSettingsSchema = generateRuntimeSettingsSchema(runtimeRegistry);

	return {
		type: 'object',
		properties: {
			memorySizeBytes: { type: 'number' },
			runtimeSettings: runtimeSettingsSchema,
			disableAutoCompilation: { type: 'boolean' },
			binaryAssets: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						url: { type: 'string' },
						memoryId: { type: 'string' },
					},
					required: ['url', 'memoryId'],
					additionalProperties: false,
				},
			},
		},
		additionalProperties: false,
	};
}
