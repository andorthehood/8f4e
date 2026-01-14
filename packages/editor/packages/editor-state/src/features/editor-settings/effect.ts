import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../../types';
import { warn } from '../logger/logger';

import type { State } from '../../types';

export default function editorSettings(store: StateManager<State>, events: EventDispatcher, defaultState: State): void {
	const state = store.getState();

	state.editorSettings = { ...defaultState.editorSettings };

	void (async () => {
		if (state.callbacks.getListOfColorSchemes) {
			try {
				const colorSchemes = await state.callbacks.getListOfColorSchemes();
				state.colorSchemes = colorSchemes;
			} catch (err) {
				console.warn('Failed to load color schemes:', err);
				warn(state, 'Failed to load color schemes');
				state.colorSchemes = [];
			}
		}

		const loadEditorSettings = state.callbacks.loadEditorSettings;
		if (state.featureFlags.persistentStorage && loadEditorSettings) {
			try {
				const loadedEditorSettings = await loadEditorSettings();
				if (loadedEditorSettings) {
					store.set('editorSettings', loadedEditorSettings);
				}
			} catch (err) {
				console.warn('Failed to load editor settings from storage:', err);
				warn(state, 'Failed to load editor settings from storage');
				state.editorSettings = { ...defaultState.editorSettings };
			}
		}
	})();

	function onSaveEditorSettings() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorSettings) {
			return;
		}

		state.callbacks.saveEditorSettings(state.editorSettings);
	}

	store.subscribe('editorSettings.colorScheme', async () => {
		if (state.callbacks.getColorScheme) {
			store.set('colorScheme', await state.callbacks.getColorScheme(state.editorSettings.colorScheme));
		}
	});

	store.subscribe('editorSettings', onSaveEditorSettings);
}
