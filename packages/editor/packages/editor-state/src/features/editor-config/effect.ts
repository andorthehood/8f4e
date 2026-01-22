import { StateManager } from '@8f4e/state-manager';

import { getEditorConfigSchema } from './schema';

import deepMergeConfig from '../config-compiler/utils/deepMergeConfig';
import { extractConfigType } from '../config-compiler/utils/extractConfigBody';
import { compileConfigBlocksByType } from '../config-compiler/utils/compileConfigBlocksByType';
import { log, warn } from '../logger/logger';

import type { State, EditorConfigBlock, EventDispatcher, EditorConfig } from '~/types';

import { defaultEditorConfig } from '~/pureHelpers/state/createDefaultState';

function isEditorConfigBlock(state: State): boolean {
	if (!state.graphicHelper.selectedCodeBlock) {
		return false;
	}
	return extractConfigType(state.graphicHelper.selectedCodeBlock.code) === 'editor';
}

function isEditorConfigBlockForProgrammaticEdit(state: State): boolean {
	if (!state.graphicHelper.selectedCodeBlockForProgrammaticEdit) {
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
			.filter(block => extractConfigType(block.code) === 'editor')
			.map(block => ({
				code: block.code,
				disabled: block.disabled,
				gridCoordinates: {
					x: block.gridX,
					y: block.gridY,
				},
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
	store.subscribe('graphicHelper.codeBlocks', rebuildEditorConfig);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (!isEditorConfigBlock(state)) {
			return;
		}
		saveEditorConfigBlocks();
		rebuildEditorConfig();
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (!isEditorConfigBlockForProgrammaticEdit(state)) {
			return;
		}
		saveEditorConfigBlocks();
		rebuildEditorConfig();
	});
}
