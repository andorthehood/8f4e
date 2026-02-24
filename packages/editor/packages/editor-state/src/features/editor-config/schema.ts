import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';

/**
 * Generates the editor config schema for font.
 */
export function getEditorConfigSchema(): JSONSchemaLike {
	return {
		type: 'object',
		properties: {
			font: {
				type: 'string',
				enum: ['8x16', '6x10'],
			},
		},
		additionalProperties: false,
	};
}
