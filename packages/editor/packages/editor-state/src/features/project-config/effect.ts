import { StateManager } from '@8f4e/state-manager';

import { getProjectConfigSchema } from './schema';
import { defaultProjectConfig } from './defaults';

import { compileConfigWithDefaults } from '../config-compiler/utils/compileConfigWithDefaults';
import { isConfigBlockOfType } from '../config-compiler/utils/isConfigBlockOfType';
import { log } from '../logger/logger';
import deepEqual from '../config-compiler/utils/deepEqual';

import type { EventDispatcher, State, ProjectConfig } from '~/types';

function isProjectConfigBlock(state: State): boolean {
	return isConfigBlockOfType(state.graphicHelper.selectedCodeBlock, 'project');
}

function isProjectConfigBlockForProgrammaticEdit(state: State): boolean {
	return isConfigBlockOfType(state.graphicHelper.selectedCodeBlockForProgrammaticEdit, 'project');
}

export default function projectConfigEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	async function rebuildProjectConfig(): Promise<void> {
		const currentState = store.getState();

		if (currentState.initialProjectState?.compiledProjectConfig && !currentState.callbacks.compileConfig) {
			store.set('compiledProjectConfig', currentState.initialProjectState.compiledProjectConfig);
			return;
		}

		if (!currentState.callbacks.compileConfig) {
			store.set('compiledProjectConfig', defaultProjectConfig);
			store.set('codeErrors.projectConfigErrors', []);
			return;
		}

		const schema = getProjectConfigSchema(currentState.runtimeRegistry);
		const { compiledConfig, mergedConfig, errors, hasSource } = await compileConfigWithDefaults({
			codeBlocks: currentState.graphicHelper.codeBlocks,
			configType: 'project',
			schema,
			compileConfig: currentState.callbacks.compileConfig,
			defaultConfig: defaultProjectConfig,
		});

		if (!hasSource) {
			store.set('compiledProjectConfig', defaultProjectConfig);
			store.set('codeErrors.projectConfigErrors', []);
			return;
		}

		console.log(`[Project Config] Config loaded:`, mergedConfig);
		log(currentState, `Project config loaded with ${errors.length} error(s).`, 'Config');

		// Only update error array if it has changed
		if (!deepEqual(errors, currentState.codeErrors.projectConfigErrors)) {
			store.set('codeErrors.projectConfigErrors', errors);
		}

		// Only update config if it has changed and there are no errors.
		// This keeps the last valid config while the user is mid-edit with invalid input.
		if (errors.length === 0 && !deepEqual(compiledConfig, currentState.compiledProjectConfig)) {
			store.set('compiledProjectConfig', compiledConfig as ProjectConfig);
		}
	}

	events.on('compileConfig', rebuildProjectConfig);
	store.subscribe('compiledProjectConfig.colorScheme', () => {
		store.set('colorScheme', state.compiledProjectConfig.colorScheme);
	});
	store.subscribe('graphicHelper.codeBlocks', rebuildProjectConfig);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (!isProjectConfigBlock(state)) {
			return;
		}
		rebuildProjectConfig();
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (!isProjectConfigBlockForProgrammaticEdit(state)) {
			return;
		}
		rebuildProjectConfig();
	});
}
