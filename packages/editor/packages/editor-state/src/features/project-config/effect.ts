import { StateManager } from '@8f4e/state-manager';

import { getProjectConfigSchema } from './schema';

import { compileConfigWithDefaults } from '../config-compiler/utils/compileConfigWithDefaults';
import { isConfigBlockOfType } from '../config-compiler/utils/isConfigBlockOfType';
import { log } from '../logger/logger';

import type { EventDispatcher, State, ProjectConfig } from '~/types';

import { defaultProjectConfig } from '~/pureHelpers/state/createDefaultState';

function isProjectConfigBlock(state: State): boolean {
	return isConfigBlockOfType(state.graphicHelper.selectedCodeBlock, 'project');
}

function isProjectConfigBlockForProgrammaticEdit(state: State): boolean {
	return isConfigBlockOfType(state.graphicHelper.selectedCodeBlockForProgrammaticEdit, 'project');
}

export default function projectConfigEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	async function rebuildProjectConfig(): Promise<void> {
		if (state.initialProjectState?.compiledProjectConfig && !state.callbacks.compileConfig) {
			store.set('compiledProjectConfig', state.initialProjectState.compiledProjectConfig);
			return;
		}

		if (!state.callbacks.compileConfig) {
			store.set('compiledProjectConfig', defaultProjectConfig);
			store.set('codeErrors.projectConfigErrors', []);
			return;
		}

		const schema = getProjectConfigSchema(state.runtimeRegistry);
		const { compiledConfig, mergedConfig, errors, hasSource } = await compileConfigWithDefaults({
			codeBlocks: state.graphicHelper.codeBlocks,
			configType: 'project',
			schema,
			compileConfig: state.callbacks.compileConfig,
			defaultConfig: defaultProjectConfig,
		});

		if (!hasSource) {
			store.set('compiledProjectConfig', defaultProjectConfig);
			store.set('codeErrors.projectConfigErrors', []);
			return;
		}

		console.log(`[Project Config] Config loaded:`, mergedConfig);
		log(state, `Project config loaded with ${errors.length} error(s).`, 'Config');

		store.set('codeErrors.projectConfigErrors', errors);
		store.set('compiledProjectConfig', compiledConfig as ProjectConfig);
	}

	events.on('compileConfig', rebuildProjectConfig);
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
