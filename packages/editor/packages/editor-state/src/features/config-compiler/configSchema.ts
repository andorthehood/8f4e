import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { Font } from '@8f4e/sprite-generator';
import type { RuntimeRegistry } from '~/types';

/**
 * Valid font values for editor config.
 * Must match the Font type from @8f4e/sprite-generator.
 */
const VALID_FONTS: Font[] = ['6x10', '8x16'];

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
 * Generates the config schema for project config.
 */
export function getConfigSchema(runtimeRegistry: RuntimeRegistry): JSONSchemaLike {
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

/**
 * Generates the config schema for editor config.
 */
export function getEditorConfigSchema(): JSONSchemaLike {
	return {
		type: 'object',
		properties: {
			colorScheme: { type: 'string' },
			font: {
				type: 'string',
				enum: VALID_FONTS,
			},
		},
		additionalProperties: false,
	};
}
