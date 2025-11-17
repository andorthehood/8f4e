import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function editorSettings(store: StateManager<State>, events: EventDispatcher, defaultState: State): void {
	const state = store.getState();

	// Create a fresh copy of editorSettings to avoid shared references
	state.editorSettings = { ...defaultState.editorSettings };

	// Load color schemes and settings asynchronously
	void (async () => {
		// Load color schemes first
		if (state.callbacks.getListOfColorSchemes) {
			try {
				const colorSchemes = await state.callbacks.getListOfColorSchemes();
				state.colorSchemes = colorSchemes;
			} catch (error) {
				console.warn('Failed to load color schemes:', error);
				state.colorSchemes = [];
			}
		}

		// Then load editor settings
		const loadEditorSettings = state.callbacks.loadEditorSettings;
		if (state.featureFlags.persistentStorage && loadEditorSettings) {
			try {
				const loadedEditorSettings = await loadEditorSettings();
				if (loadedEditorSettings) {
					store.set('editorSettings', loadedEditorSettings);
				}
			} catch (error) {
				console.warn('Failed to load editor settings from storage:', error);
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
		// Reload color scheme from callback
		if (state.callbacks.getColorScheme) {
			store.set('colorScheme', await state.callbacks.getColorScheme(state.editorSettings.colorScheme));
		}
	});

	store.subscribe('editorSettings', onSaveEditorSettings);
}
