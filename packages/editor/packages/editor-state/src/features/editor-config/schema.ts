import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';

/**
 * Generates the editor config schema for font and colorScheme.
 */
export function getEditorConfigSchema(): JSONSchemaLike {
	return {
		type: 'object',
		properties: {
			font: {
				type: 'string',
				enum: ['8x16', '6x10'],
			},
			colorScheme: {
				type: 'string',
				enum: ['redalert', 'hackerman', 'default'],
			},
		},
		additionalProperties: false,
	};
}
