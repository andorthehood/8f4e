import { FONT_NAMES, type Font } from '@8f4e/sprite-generator';

import { getEditorConfigPath } from '../editor-config/paths';
import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

import type { EditorConfig, EditorConfigValidator } from '../editor-config/types';
import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

export const DEFAULT_FONT: Font = 'ibmvga8x16';
const ALLOWED_FONTS = new Set<Font>(FONT_NAMES);

export const fontEditorConfigValidator: EditorConfigValidator = {
	knownPaths: ['font'],
	matches: path => path === 'font',
	validate: entry =>
		ALLOWED_FONTS.has(entry.value as Font)
			? undefined
			: `@config font: unsupported font '${entry.value}'${formatDidYouMeanSuffix(entry.value, FONT_NAMES)}`,
};

export function getEditorConfigFont(config: EditorConfig): Font {
	const value = getEditorConfigPath(config, 'font');
	return value && ALLOWED_FONTS.has(value as Font) ? (value as Font) : DEFAULT_FONT;
}

export function registerFontEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.font', fontEditorConfigValidator);
}
