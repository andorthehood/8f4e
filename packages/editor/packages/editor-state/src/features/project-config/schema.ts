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
			colorScheme: {
				type: 'object',
				properties: {
					text: {
						type: 'object',
						properties: {
							lineNumber: { type: 'string' },
							instruction: { type: 'string' },
							codeComment: { type: 'string' },
							code: { type: 'string' },
							disabledCode: { type: 'string' },
							numbers: { type: 'string' },
							menuItemText: { type: 'string' },
							menuItemTextHighlighted: { type: 'string' },
							dialogTitle: { type: 'string' },
							dialogText: { type: 'string' },
							binaryZero: { type: 'string' },
							binaryOne: { type: 'string' },
						},
						additionalProperties: false,
					},
					fill: {
						type: 'object',
						properties: {
							menuItemBackground: { type: 'string' },
							menuItemBackgroundHighlighted: { type: 'string' },
							background: { type: 'string' },
							backgroundDots: { type: 'string' },
							backgroundDots2: { type: 'string' },
							moduleBackground: { type: 'string' },
							moduleBackgroundDragged: { type: 'string' },
							moduleBackgroundDisabled: { type: 'string' },
							wire: { type: 'string' },
							wireHighlighted: { type: 'string' },
							errorMessageBackground: { type: 'string' },
							dialogBackground: { type: 'string' },
							dialogDimmer: { type: 'string' },
							highlightedCodeLine: { type: 'string' },
							plotterTrace: { type: 'string' },
							plotterBackground: { type: 'string' },
							scanLine: { type: 'string' },
							sliderThumb: { type: 'string' },
							codeBlockHighlightLevel1: { type: 'string' },
							codeBlockHighlightLevel2: { type: 'string' },
							codeBlockHighlightLevel3: { type: 'string' },
						},
						additionalProperties: false,
					},
					icons: {
						type: 'object',
						properties: {
							inputConnector: { type: 'string' },
							outputConnector: { type: 'string' },
							inputConnectorBackground: { type: 'string' },
							outputConnectorBackground: { type: 'string' },
							switchBackground: { type: 'string' },
							feedbackScale: {
								type: 'array',
								items: { type: 'string' },
							},
							arrow: { type: 'string' },
							pianoKeyWhite: { type: 'string' },
							pianoKeyWhiteHighlighted: { type: 'string' },
							pianoKeyWhitePressed: { type: 'string' },
							pianoKeyBlack: { type: 'string' },
							pianoKeyBlackHighlighted: { type: 'string' },
							pianoKeyBlackPressed: { type: 'string' },
							pianoKeyboardBackground: { type: 'string' },
							pianoKeyboardNote: { type: 'string' },
							pianoKeyboardNoteHighlighted: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				additionalProperties: false,
			},
			exportFileName: { type: 'string' },
			keyCodeMemoryId: { type: 'string' },
			keyPressedMemoryId: { type: 'string' },
		},
		additionalProperties: false,
	};
}
