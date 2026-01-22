import { StateManager } from '@8f4e/state-manager';

import { warn } from '../logger/logger';
import { extractConfigType } from '../config-compiler/extractConfigBody';

import type { State, EditorConfigBlock } from '~/types';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { EventDispatcher } from '~/types';

/**
 * Effect that manages editor config blocks and their persistence.
 * Editor config blocks are stored locally and not included in project export.
 */
export default function editorConfigEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	// Load available color schemes
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

		// Load editor config blocks from storage
		const loadEditorConfigBlocks = state.callbacks.loadEditorConfigBlocks;
		if (state.featureFlags.persistentStorage && loadEditorConfigBlocks) {
			try {
				const loadedBlocks = await loadEditorConfigBlocks();
				if (loadedBlocks && loadedBlocks.length > 0) {
					// Inject editor config blocks into codeBlocks
					// Use high creationIndex to place them after other blocks
					const maxCreationIndex = state.graphicHelper.codeBlocks.reduce(
						(max, block) => Math.max(max, block.creationIndex),
						-1
					);

					for (let i = 0; i < loadedBlocks.length; i++) {
						const rawBlock = loadedBlocks[i];
						const configType = extractConfigType(rawBlock.code);

						// Only add if it's an editor config block
						if (configType === 'editor') {
							const newBlock = createMockCodeBlock({
								id: `editor-config-${i}`,
								code: rawBlock.code,
								disabled: rawBlock.disabled || false,
								creationIndex: maxCreationIndex + i + 1,
								blockType: 'config',
							});
							state.graphicHelper.codeBlocks.push(newBlock);
						}
					}

					// Update next creation index
					state.graphicHelper.nextCodeBlockCreationIndex = maxCreationIndex + loadedBlocks.length + 1;

					// Trigger config compilation
					events.dispatch('compileConfig');
				}
			} catch (err) {
				console.warn('Failed to load editor config blocks from storage:', err);
				warn(state, 'Failed to load editor config blocks from storage');
			}
		}
	})();

	/**
	 * Saves editor config blocks to storage.
	 * Extracts only editor config blocks from codeBlocks array.
	 */
	function saveEditorConfigBlocks() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorConfigBlocks) {
			return;
		}

		// Extract only editor config blocks
		const editorConfigBlocks: EditorConfigBlock[] = state.graphicHelper.codeBlocks
			.filter(block => {
				if (block.blockType !== 'config') {
					return false;
				}
				const configType = extractConfigType(block.code);
				return configType === 'editor';
			})
			.map(block => ({
				code: block.code,
				disabled: block.disabled,
			}));

		state.callbacks.saveEditorConfigBlocks(editorConfigBlocks);
	}

	// Subscribe to compiledEditorConfig changes to update color scheme
	store.subscribe('compiledEditorConfig.colorScheme', async () => {
		if (state.callbacks.getColorScheme) {
			try {
				const colorScheme = await state.callbacks.getColorScheme(state.compiledEditorConfig.colorScheme);
				store.set('colorScheme', colorScheme);
			} catch (err) {
				console.warn('Failed to load color scheme:', err);
				warn(state, 'Failed to load color scheme');
			}
		}
	});

	// Save editor config blocks when codeBlocks change
	store.subscribe('graphicHelper.codeBlocks', saveEditorConfigBlocks);
}
