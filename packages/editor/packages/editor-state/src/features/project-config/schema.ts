import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { RuntimeRegistry } from '~/types';

/**
 * Generates the config schema.
 */
export function getProjectConfigSchema(runtimeRegistry: RuntimeRegistry, runtimeId: string): JSONSchemaLike {
	const runtimeSettingsSchema = runtimeRegistry[runtimeId]?.schema ?? { type: 'object' };

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
