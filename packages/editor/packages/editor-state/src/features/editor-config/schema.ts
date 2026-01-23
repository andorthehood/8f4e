import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';

import { State } from '~/types';

/**
 * Generates the editor config schema for font and colorScheme.
 */
export function getEditorConfigSchema(state: State): JSONSchemaLike {
	return {
		type: 'object',
		properties: {
			font: {
				type: 'string',
				enum: ['8x16', '6x10'],
			},
			colorScheme: {
				type: 'string',
				enum: state.colorSchemes,
			},
		},
		additionalProperties: false,
	};
}
