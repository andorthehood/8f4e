import { StateManager } from '@8f4e/state-manager';

import deepMergeConfig from '../config-compiler/deepMergeConfig';
import { extractConfigType } from '../config-compiler/extractConfigBody';
import { getConfigSchema } from '../config-compiler/projectConfigSchema';
import { compileConfigBlocksByType } from '../config-compiler/utils/compileConfigBlocksByType';
import { log } from '../logger/logger';

import type { EventDispatcher, State, ProjectConfig } from '~/types';

import { defaultProjectConfig } from '~/pureHelpers/state/createDefaultState';

function isProjectConfigBlock(state: State): boolean {
	if (state.graphicHelper.selectedCodeBlock?.blockType !== 'config') {
		return false;
	}
	return extractConfigType(state.graphicHelper.selectedCodeBlock.code) === 'project';
}

function isProjectConfigBlockForProgrammaticEdit(state: State): boolean {
	if (state.graphicHelper.selectedCodeBlockForProgrammaticEdit?.blockType !== 'config') {
		return false;
	}
	return extractConfigType(state.graphicHelper.selectedCodeBlockForProgrammaticEdit.code) === 'project';
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

		const schema = getConfigSchema(state.runtimeRegistry);
		const { mergedConfig, errors, hasSource } = await compileConfigBlocksByType({
			codeBlocks: state.graphicHelper.codeBlocks,
			configType: 'project',
			schema,
			compileConfig: state.callbacks.compileConfig,
		});

		if (!hasSource) {
			store.set('compiledProjectConfig', defaultProjectConfig);
			store.set('codeErrors.projectConfigErrors', []);
			return;
		}

		console.log(`[Project Config] Config loaded:`, mergedConfig);
		log(state, `Project config loaded with ${errors.length} error(s).`, 'Config');

		store.set('codeErrors.projectConfigErrors', errors);
		store.set(
			'compiledProjectConfig',
			deepMergeConfig(
				defaultProjectConfig as unknown as Record<string, unknown>,
				mergedConfig
			) as unknown as ProjectConfig
		);
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
