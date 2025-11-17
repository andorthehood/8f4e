import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function editorSettings(store: StateManager<State>, events: EventDispatcher, defaultState: State): void {
	const state = store.getState();

	// Create a fresh copy of editorSettings to avoid shared references
	state.editorSettings = { ...defaultState.editorSettings };

	// Load color schemes first
	const colorSchemesPromise = state.callbacks.getListOfColorSchemes
		? state.callbacks
				.getListOfColorSchemes()
				.then(colorSchemes => {
					state.colorSchemes = colorSchemes;
				})
				.catch(error => {
					console.warn('Failed to load color schemes:', error);
					state.colorSchemes = [];
				})
		: Promise.resolve();

	const loadEditorSettings = state.callbacks.loadEditorSettings;
	const settingsPromise = colorSchemesPromise.then(() =>
		state.featureFlags.persistentStorage && loadEditorSettings
			? loadEditorSettings()
					.then(loadedEditorSettings => {
						if (loadedEditorSettings) {
							store.set('editorSettings', loadedEditorSettings);
						}
					})
					.catch(error => {
						console.warn('Failed to load editor settings from storage:', error);
						state.editorSettings = { ...defaultState.editorSettings };
					})
			: Promise.resolve()
	);

	// Wait for settings to load before returning
	void settingsPromise;

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
