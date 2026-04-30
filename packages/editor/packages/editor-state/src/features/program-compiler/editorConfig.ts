import type { EditorConfigValidator, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

export const RECOMPILE_DEBOUNCE_DELAY_CONFIG_PATH = 'recompileDebounceDelay';
export const DEFAULT_RECOMPILE_DEBOUNCE_DELAY = 500;

export const recompileDebounceDelayEditorConfigValidator: EditorConfigValidator = {
	knownPaths: [RECOMPILE_DEBOUNCE_DELAY_CONFIG_PATH],
	matches: path => path === RECOMPILE_DEBOUNCE_DELAY_CONFIG_PATH,
	validate: entry => {
		const delay = Number(entry.value);

		return Number.isInteger(delay) && delay >= 0
			? undefined
			: `@config ${RECOMPILE_DEBOUNCE_DELAY_CONFIG_PATH}: delay must be a non-negative integer`;
	},
	parse: entry => Number(entry.value),
};

export function registerRecompileDebounceDelayEditorConfigValidator(store: StateManager<State>): void {
	store.set('editorConfigValidators.recompileDebounceDelay', recompileDebounceDelayEditorConfigValidator);
}
