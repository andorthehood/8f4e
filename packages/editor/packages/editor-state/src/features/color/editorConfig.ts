import { defaultColorScheme, type ColorSchemeOverrides } from '@8f4e/sprite-generator';

import { getEditorConfigPath, setPathValue } from '../editor-config/paths';
import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

import type { EditorConfig, EditorConfigValidator } from '../editor-config/types';
import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

const COLOR_CONFIG_PREFIX = 'color.';

function isValidColorValue(value: string): boolean {
	if (value.length === 0) {
		return false;
	}

	return /^#[0-9a-fA-F]{3,8}$/.test(value) || /^(rgb|rgba|hsl|hsla)\([^)]*\)$/.test(value) || /^[a-zA-Z]+$/.test(value);
}

function collectColorPaths(value: Record<string, unknown>, prefix = ''): string[] {
	const paths: string[] = [];

	for (const [key, child] of Object.entries(value)) {
		const nextPath = prefix ? `${prefix}.${key}` : key;
		if (typeof child === 'string') {
			paths.push(nextPath);
			continue;
		}

		if (child && typeof child === 'object' && !Array.isArray(child)) {
			paths.push(...collectColorPaths(child as Record<string, unknown>, nextPath));
		}
	}

	return paths;
}

const COLOR_PATHS = collectColorPaths(defaultColorScheme as unknown as Record<string, unknown>);
const COLOR_CONFIG_PATHS = COLOR_PATHS.map(path => `${COLOR_CONFIG_PREFIX}${path}`);

export const colorEditorConfigValidator: EditorConfigValidator = {
	knownPaths: COLOR_CONFIG_PATHS,
	matches: path => path.startsWith(COLOR_CONFIG_PREFIX),
	validate: entry => {
		const colorPath = entry.path.slice(COLOR_CONFIG_PREFIX.length);
		if (!COLOR_PATHS.includes(colorPath)) {
			return `@config: unknown config path '${entry.path}'${formatDidYouMeanSuffix(entry.path, COLOR_CONFIG_PATHS)}`;
		}

		if (!isValidColorValue(entry.value)) {
			return `@config ${entry.path}: invalid color value '${entry.value}'`;
		}

		return undefined;
	},
};

export function getEditorConfigColorSchemeOverrides(config: EditorConfig): ColorSchemeOverrides {
	const colorSchemeOverrides: ColorSchemeOverrides = {};

	for (const colorPath of COLOR_PATHS) {
		const value = getEditorConfigPath(config, `${COLOR_CONFIG_PREFIX}${colorPath}`);
		if (value && isValidColorValue(value)) {
			setPathValue(colorSchemeOverrides as Record<string, unknown>, colorPath, value);
		}
	}

	return colorSchemeOverrides;
}

export function registerColorEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.color', colorEditorConfigValidator);
}
