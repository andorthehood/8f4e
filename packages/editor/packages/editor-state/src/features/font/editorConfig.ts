import { FONT_NAMES, type Font } from '@8f4e/sprite-generator';

import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

import type { EditorConfigValidator } from '../editor-config/types';
import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

const ALLOWED_FONTS = new Set<Font>(FONT_NAMES);

export const fontEditorConfigValidator: EditorConfigValidator = {
	knownPaths: ['font'],
	matches: path => path === 'font',
	validate: entry =>
		ALLOWED_FONTS.has(entry.value as Font)
			? undefined
			: `@config font: unsupported font '${entry.value}'${formatDidYouMeanSuffix(entry.value, FONT_NAMES)}`,
};

export function registerFontEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.font', fontEditorConfigValidator);
}
