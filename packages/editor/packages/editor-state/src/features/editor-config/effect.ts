import { StateManager } from '@8f4e/state-manager';

import { getEditorConfigSchema } from './schema';
import { isEditorConfigBlock, serializeEditorConfigBlocks } from './utils/editorConfigBlocks';

import { compileConfigWithDefaults } from '../config-compiler/utils/compileConfigWithDefaults';
import { log, warn } from '../logger/logger';

import type { State, EventDispatcher, EditorConfig } from '~/types';

import { defaultEditorConfig } from '~/pureHelpers/state/createDefaultState';

function isEditorConfigBlockForProgrammaticEdit(state: State): boolean {
	return isEditorConfigBlock(state.graphicHelper.selectedCodeBlockForProgrammaticEdit ?? null);
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
		const { compiledConfig, mergedConfig, errors, hasSource } = await compileConfigWithDefaults({
			codeBlocks: state.graphicHelper.codeBlocks,
			configType: 'editor',
			schema,
			compileConfig: state.callbacks.compileConfig,
			defaultConfig: defaultEditorConfig,
		});

		if (!hasSource) {
			store.set('compiledEditorConfig', defaultEditorConfig);
			store.set('codeErrors.editorConfigErrors', []);
			return;
		}

		console.log(`[Editor Config] Config loaded:`, mergedConfig);
		log(state, `Editor config loaded with ${errors.length} error(s).`, 'Config');

		store.set('codeErrors.editorConfigErrors', errors);
		store.set('compiledEditorConfig', compiledConfig as EditorConfig);
	}

	function saveEditorConfigBlocks() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorConfigBlocks) {
			return;
		}

		state.callbacks.saveEditorConfigBlocks(serializeEditorConfigBlocks(state.graphicHelper.codeBlocks));
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
		if (!isEditorConfigBlock(state.graphicHelper.selectedCodeBlock ?? null)) {
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
