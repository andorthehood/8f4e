import { StateManager } from '@8f4e/state-manager';

import deepMergeConfig from '../config-compiler/deepMergeConfig';
import { getEditorConfigSchema } from '../config-compiler/editorConfigSchema';
import { extractConfigType } from '../config-compiler/extractConfigBody';
import { compileConfigBlocksByType } from '../config-compiler/utils/compileConfigBlocksByType';
import { log, warn } from '../logger/logger';
import { createCodeBlockGraphicData } from '../code-blocks/utils/createCodeBlockGraphicData';

import type { State, EditorConfigBlock, EventDispatcher, EditorConfig } from '~/types';

import { defaultEditorConfig } from '~/pureHelpers/state/createDefaultState';

function isEditorConfigBlock(state: State): boolean {
	if (state.graphicHelper.selectedCodeBlock?.blockType !== 'config') {
		return false;
	}
	return extractConfigType(state.graphicHelper.selectedCodeBlock.code) === 'editor';
}

function isEditorConfigBlockForProgrammaticEdit(state: State): boolean {
	if (state.graphicHelper.selectedCodeBlockForProgrammaticEdit?.blockType !== 'config') {
		return false;
	}
	return extractConfigType(state.graphicHelper.selectedCodeBlockForProgrammaticEdit.code) === 'editor';
}

export default function editorConfigEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

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

		const loadEditorConfigBlocks = state.callbacks.loadEditorConfigBlocks;
		if (state.featureFlags.persistentStorage && loadEditorConfigBlocks) {
			try {
				const loadedBlocks = await loadEditorConfigBlocks();
				if (loadedBlocks && loadedBlocks.length > 0) {
					const maxCreationIndex = state.graphicHelper.codeBlocks.reduce(
						(max, block) => Math.max(max, block.creationIndex),
						-1
					);

					for (let i = 0; i < loadedBlocks.length; i += 1) {
						const rawBlock = loadedBlocks[i];
						const configType = extractConfigType(rawBlock.code);

						if (configType === 'editor') {
							const newBlock = createCodeBlockGraphicData({
								id: `editor-config-${i}`,
								code: rawBlock.code,
								disabled: rawBlock.disabled || false,
								creationIndex: maxCreationIndex + i + 1,
								blockType: 'config',
							});
							state.graphicHelper.codeBlocks.push(newBlock);
						}
					}

					state.graphicHelper.nextCodeBlockCreationIndex = maxCreationIndex + loadedBlocks.length + 1;

					events.dispatch('compileConfig');
				}
			} catch (err) {
				console.warn('Failed to load editor config blocks from storage:', err);
				warn(state, 'Failed to load editor config blocks from storage');
			}
		}
	})();

	async function rebuildEditorConfig(): Promise<void> {
		if (!state.callbacks.compileConfig) {
			store.set('compiledEditorConfig', defaultEditorConfig);
			store.set('codeErrors.editorConfigErrors', []);
			return;
		}

		const schema = getEditorConfigSchema();
		const { mergedConfig, errors, hasSource } = await compileConfigBlocksByType({
			codeBlocks: state.graphicHelper.codeBlocks,
			configType: 'editor',
			schema,
			compileConfig: state.callbacks.compileConfig,
		});

		if (!hasSource) {
			store.set('compiledEditorConfig', defaultEditorConfig);
			store.set('codeErrors.editorConfigErrors', []);
			return;
		}

		console.log(`[Editor Config] Config loaded:`, mergedConfig);
		log(state, `Editor config loaded with ${errors.length} error(s).`, 'Config');

		store.set('codeErrors.editorConfigErrors', errors);
		store.set(
			'compiledEditorConfig',
			deepMergeConfig(
				defaultEditorConfig as unknown as Record<string, unknown>,
				mergedConfig
			) as unknown as EditorConfig
		);
	}

	function saveEditorConfigBlocks() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorConfigBlocks) {
			return;
		}

		const editorConfigBlocks: EditorConfigBlock[] = state.graphicHelper.codeBlocks
			.filter(block => {
				if (block.blockType !== 'config') {
					return false;
				}
				return extractConfigType(block.code) === 'editor';
			})
			.map(block => ({
				code: block.code,
				disabled: block.disabled,
			}));

		state.callbacks.saveEditorConfigBlocks(editorConfigBlocks);
	}

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

	events.on('compileConfig', rebuildEditorConfig);
	store.subscribe('graphicHelper.codeBlocks', () => {
		saveEditorConfigBlocks();
		rebuildEditorConfig();
	});
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (!isEditorConfigBlock(state)) {
			return;
		}
		rebuildEditorConfig();
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (!isEditorConfigBlockForProgrammaticEdit(state)) {
			return;
		}
		rebuildEditorConfig();
	});
}
