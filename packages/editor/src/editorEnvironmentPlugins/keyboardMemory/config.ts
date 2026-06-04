import type { EditorConfigSchemaContribution, State } from '@8f4e/editor-state-types';

export const KEYBOARD_EDITOR_CONFIG_SCHEMA_CONTRIBUTION_ID = 'keyboard';

const MODULE_MEMORY_ID_SCHEMA = {
	type: 'string' as const,
	pattern: '^[^:\\s]+:[^:\\s]+$',
};

export const keyboardEditorConfigSchemaContribution: EditorConfigSchemaContribution = {
	root: 'keyboard',
	schema: {
		type: 'object',
		properties: {
			keyCodeMemory: MODULE_MEMORY_ID_SCHEMA,
			keyPressedMemory: MODULE_MEMORY_ID_SCHEMA,
		},
		additionalProperties: false,
	},
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getConfigValue(config: Record<string, unknown>, key: string): string | undefined {
	const value = config[key];
	return typeof value === 'string' ? value : undefined;
}

export interface KeyboardMemoryConfig {
	keyCodeMemory?: string;
	keyPressedMemory?: string;
}

export function getKeyboardMemoryConfig(state: State): KeyboardMemoryConfig {
	const config = isRecord(state.editorConfig.keyboard) ? state.editorConfig.keyboard : {};

	return {
		keyCodeMemory: getConfigValue(config, 'keyCodeMemory'),
		keyPressedMemory: getConfigValue(config, 'keyPressedMemory'),
	};
}
