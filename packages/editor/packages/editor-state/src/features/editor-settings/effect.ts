import { StateManager } from '@8f4e/state-manager';

import { warn } from '../logger/logger';
import { combineEditorConfigBlocks } from '../config-compiler/combineConfigBlocks';
import { compileEditorConfigFromCombined } from '../config-compiler/compileEditorConfigFromCombined';

import type { State } from '~/types';

import { EventDispatcher } from '~/types';

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

	/**
	 * Compiles editor config blocks and applies them to editorSettings.
	 */
	async function compileEditorConfig(): Promise<void> {
		if (!state.callbacks.compileConfig) {
			return;
		}

		const combined = combineEditorConfigBlocks(state.graphicHelper.codeBlocks);
		if (combined.source.trim().length === 0) {
			store.set('codeErrors.editorConfigErrors', []);
			return;
		}

		const { editorSettings: compiledSettings, errors } = await compileEditorConfigFromCombined(
			combined,
			state.callbacks.compileConfig
		);

		// Apply compiled settings to state (merge with existing settings)
		if (Object.keys(compiledSettings).length > 0) {
			store.set('editorSettings', {
				...state.editorSettings,
				...compiledSettings,
			});
		}

		// Save errors to state
		store.set('codeErrors.editorConfigErrors', errors);
	}

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

	// Subscribe to code blocks to recompile editor config when they change
	store.subscribe('graphicHelper.codeBlocks', compileEditorConfig);

	// Subscribe to code changes in selected blocks if it's an editor config block
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (state.graphicHelper.selectedCodeBlock?.disabled) {
			return;
		}

		// Check if this is an editor config block
		const block = state.graphicHelper.selectedCodeBlock;
		if (block?.blockType !== 'config') {
			return;
		}

		// Check if it's specifically an editor config
		const configLine = block.code.find(line => /^\s*config\s+editor/.test(line));
		if (!configLine) {
			return;
		}

		compileEditorConfig();
	});
}
