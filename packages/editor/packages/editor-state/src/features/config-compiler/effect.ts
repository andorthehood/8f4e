import { StateManager } from '@8f4e/state-manager';

import deepMergeConfig from './deepMergeConfig';
import { combineConfigBlocks } from './combineConfigBlocks';
import { compileConfigFromCombined } from './compileConfigFromCombined';

import { log } from '../logger/logger';

import type { EventDispatcher, State, ConfigObject } from '~/types';

import { defaultConfig } from '~/pureHelpers/state/createDefaultState';

/**
 * Effect that compiles config blocks and applies the resulting configuration to state.
 * All config blocks are combined into a single source for full schema validation.
 * Errors are mapped back to individual blocks with correct line numbers.
 */
export default function configEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Rebuilds the config from all config blocks and applies it to state.
	 * All config blocks are combined and compiled as a single source for full schema validation.
	 * Errors are mapped back to individual blocks using line ranges.
	 */
	async function rebuildConfig(): Promise<void> {
		// If the compileConfig callback is not available but the project contains the compiled config.
		if (state.initialProjectState?.compiledConfig && !state.callbacks.compileConfig) {
			store.set('compiledConfig', state.initialProjectState.compiledConfig);
			return;
		}

		if (!state.callbacks.compileConfig) {
			store.set('compiledConfig', defaultConfig);
			return;
		}

		// Combine all config blocks once
		const combined = combineConfigBlocks(state.graphicHelper.codeBlocks);
		if (combined.source.trim().length === 0) {
			store.set('compiledConfig', defaultConfig);
			store.set('codeErrors.configErrors', []);
			return;
		}

		// Compile and map errors
		const { mergedConfig, errors } = await compileConfigFromCombined(combined, state.callbacks.compileConfig, state);

		console.log(`[Config] Config loaded:`, mergedConfig);
		log(state, `Config loaded with ${errors.length} error(s).`, 'Config');

		// Save all errors to state (always set, even if empty)
		store.set('codeErrors.configErrors', errors);
		store.set(
			'compiledConfig',
			deepMergeConfig(defaultConfig as unknown as Record<string, unknown>, mergedConfig) as unknown as ConfigObject
		);
	}

	// Wire up event handlers
	events.on('compileConfig', rebuildConfig);
	store.subscribe('graphicHelper.codeBlocks', rebuildConfig);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (state.graphicHelper.selectedCodeBlock?.disabled) {
			return;
		}

		if (state.graphicHelper.selectedCodeBlock?.blockType !== 'config') {
			return;
		}
		rebuildConfig();
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (state.graphicHelper.selectedCodeBlockForProgrammaticEdit?.blockType !== 'config') {
			return;
		}
		rebuildConfig();
	});
}
