import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { RuntimeRegistry } from '~/types';

/**
 * Generates the config schema.
 */
export function getProjectConfigSchema(runtimeRegistry: RuntimeRegistry, runtimeId: string): JSONSchemaLike {
	return runtimeRegistry[runtimeId]?.schema ?? { type: 'object' };
}
