import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { RuntimeRegistry } from '~/types';

/**
 * Removes the authored `runtime` discriminator from runtime settings config.
 * Runtime selection now comes from the global editor directive `; @runtime <id>`.
 */
function stripRuntimeDiscriminator(schema: JSONSchemaLike): JSONSchemaLike {
	if (schema.type !== 'object' || !schema.properties) {
		return schema;
	}

	const properties = Object.fromEntries(Object.entries(schema.properties).filter(([key]) => key !== 'runtime'));
	const required = Array.isArray(schema.required) ? schema.required.filter(key => key !== 'runtime') : undefined;

	return {
		...schema,
		properties,
		...(required ? { required } : {}),
	};
}

/**
 * Generates the config schema.
 */
export function getProjectConfigSchema(runtimeRegistry: RuntimeRegistry, runtimeId: string): JSONSchemaLike {
	const runtimeSettingsSchema = stripRuntimeDiscriminator(runtimeRegistry[runtimeId]?.schema ?? { type: 'object' });

	return {
		type: 'object',
		properties: {
			runtimeSettings: runtimeSettingsSchema,
			disableAutoCompilation: { type: 'boolean' },
			keyCodeMemoryId: { type: 'string' },
			keyPressedMemoryId: { type: 'string' },
		},
		additionalProperties: false,
	};
}
