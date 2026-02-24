import { StateManager } from '@8f4e/state-manager';

import { getEditorConfigSchema } from './schema';
import { isEditorConfigBlock, serializeEditorConfigBlocks } from './utils/editorConfigBlocks';
import { defaultEditorConfig } from './defaults';

import { compileConfigWithDefaults } from '../config-compiler/utils/compileConfigWithDefaults';
import { log } from '../logger/logger';
import deepEqual from '../config-compiler/utils/deepEqual';

import type { State, EventDispatcher, EditorConfig } from '~/types';

export default function editorConfigEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	async function rebuildEditorConfig(): Promise<void> {
		const currentState = store.getState();

		if (!currentState.callbacks.compileConfig) {
			store.set('compiledEditorConfig', defaultEditorConfig);
			store.set('codeErrors.editorConfigErrors', []);
			return;
		}

		const schema = getEditorConfigSchema();
		const { compiledConfig, mergedConfig, errors, hasSource } = await compileConfigWithDefaults({
			codeBlocks: currentState.graphicHelper.codeBlocks,
			configType: 'editor',
			schema,
			compileConfig: currentState.callbacks.compileConfig,
			defaultConfig: defaultEditorConfig,
		});

		if (!hasSource) {
			store.set('compiledEditorConfig', defaultEditorConfig);
			store.set('codeErrors.editorConfigErrors', []);
			return;
		}

		console.log(`[Editor Config] Config loaded:`, mergedConfig);
		log(currentState, `Editor config loaded with ${errors.length} error(s).`, 'Config');

		// Only update error array if it has changed
		if (!deepEqual(errors, currentState.codeErrors.editorConfigErrors)) {
			store.set('codeErrors.editorConfigErrors', errors);
		}

		// Only update config if it has changed and there are no errors.
		// This keeps the last valid config while the user is mid-edit with invalid input.
		if (errors.length === 0 && !deepEqual(compiledConfig, currentState.compiledEditorConfig)) {
			store.set('compiledEditorConfig', compiledConfig as EditorConfig);
		}
	}

	function saveEditorConfigBlocks() {
		if (!state.callbacks.saveEditorConfigBlocks) {
			return;
		}

		state.callbacks.saveEditorConfigBlocks(serializeEditorConfigBlocks(state.graphicHelper.codeBlocks));
	}

	events.on('compileConfig', rebuildEditorConfig);
	store.subscribe('graphicHelper.codeBlocks', rebuildEditorConfig);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (!isEditorConfigBlock(state.graphicHelper.selectedCodeBlock ?? null)) {
			return;
		}
		saveEditorConfigBlocks();
		rebuildEditorConfig();
	});
}
