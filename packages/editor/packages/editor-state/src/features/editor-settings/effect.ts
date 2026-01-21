import { StateManager } from '@8f4e/state-manager';

import { warn } from '../logger/logger';
import { combineEditorConfigBlocks } from '../config-compiler/combineConfigBlocks';
import { compileEditorConfigFromCombined } from '../config-compiler/compileEditorConfigFromCombined';

import type { State } from '~/types';

import { EventDispatcher } from '~/types';

/**
 * Regex pattern to match editor config blocks.
 */
const EDITOR_CONFIG_REGEX = /^\s*config\s+editor/;

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

		// Load editor config source from persistent storage
		// Note: This is loaded separately from editor settings and would create code blocks
		// The source is the full block including markers and comments
		// TODO: Implement code block creation from loaded source (tracked in #197)
		// This requires integration with the code block creation logic to properly
		// instantiate editor config blocks with correct positioning and state
		if (state.featureFlags.persistentStorage && state.callbacks.loadEditorConfigSource) {
			try {
				const loadedConfigSource = await state.callbacks.loadEditorConfigSource();
				if (loadedConfigSource && loadedConfigSource.length > 0) {
					console.log('[Editor Config] Loaded editor config source, but block creation not yet implemented');
				}
			} catch (err) {
				console.warn('Failed to load editor config source from storage:', err);
				warn(state, 'Failed to load editor config source from storage');
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

	/**
	 * Saves editor config block source to persistent storage.
	 * Collects all editor config blocks and saves their full source (including markers/comments).
	 */
	function saveEditorConfigSource(): void {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorConfigSource) {
			return;
		}

		// Find all editor config blocks
		const editorConfigBlocks = state.graphicHelper.codeBlocks
			.filter(block => {
				if (block.blockType !== 'config') return false;
				// Check if it's an editor config block
				return block.code.some(line => EDITOR_CONFIG_REGEX.test(line));
			})
			.sort((a, b) => a.creationIndex - b.creationIndex);

		// If there are no editor config blocks, save empty array
		if (editorConfigBlocks.length === 0) {
			state.callbacks.saveEditorConfigSource([]);
			return;
		}

		// For now, we'll save the first editor config block found
		// In the future, we could concatenate multiple blocks or save them separately
		const firstBlock = editorConfigBlocks[0];
		state.callbacks.saveEditorConfigSource(firstBlock.code);
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

	// Subscribe to code blocks to recompile editor config and save source when they change
	store.subscribe('graphicHelper.codeBlocks', () => {
		compileEditorConfig();
		saveEditorConfigSource();
	});

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
		const configLine = block.code.find(line => EDITOR_CONFIG_REGEX.test(line));
		if (!configLine) {
			return;
		}

		compileEditorConfig();
		saveEditorConfigSource();
	});
}
