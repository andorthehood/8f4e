import type { EditorConfigValidator, JSONSchemaLike, State } from '@8f4e/editor-state-types';
import { defaultColorScheme } from '@8f4e/sprite-generator';
import type { StateManager } from '@8f4e/state-manager';
import { collectSchemaConfigPaths, createSchemaEditorConfigValidator } from '../editor-config/schemaValidator';
import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

const COLOR_CONFIG_ROOT = 'color';

function isValidColorValue(value: string): boolean {
	if (value.length === 0) {
		return false;
	}

	return /^#[0-9a-fA-F]{3,8}$/.test(value) || /^(rgb|rgba|hsl|hsla)\([^)]*\)$/.test(value) || /^[a-zA-Z]+$/.test(value);
}

function createColorSchema(value: Record<string, unknown>): JSONSchemaLike {
	const properties: Record<string, JSONSchemaLike> = {};

	for (const [key, child] of Object.entries(value)) {
		properties[key] =
			typeof child === 'string' ? { type: 'string' } : createColorSchema(child as Record<string, unknown>);
	}

	return {
		type: 'object',
		properties,
		additionalProperties: false,
	};
}

const COLOR_SCHEMA = createColorSchema(defaultColorScheme as unknown as Record<string, unknown>);
const COLOR_CONFIG_PATHS = collectSchemaConfigPaths(COLOR_CONFIG_ROOT, COLOR_SCHEMA);

export const colorEditorConfigValidator: EditorConfigValidator = createSchemaEditorConfigValidator({
	root: COLOR_CONFIG_ROOT,
	schema: COLOR_SCHEMA,
	formatPathError: path => `@config: unknown config path '${path}'${formatDidYouMeanSuffix(path, COLOR_CONFIG_PATHS)}`,
	validateValue: (entry, schema) => {
		if (schema.type === 'string' && !isValidColorValue(entry.value)) {
			return `@config ${entry.path}: invalid color value '${entry.value}'`;
		}

		return undefined;
	},
});

export function registerColorEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.color', colorEditorConfigValidator);
}
