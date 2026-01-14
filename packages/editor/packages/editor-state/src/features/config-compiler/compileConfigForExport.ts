import deepMergeConfig from './deepMergeConfig';
import { combineConfigBlocks } from './combineConfigBlocks';
import { compileConfigFromCombined } from './compileConfigFromCombined';

import { defaultConfig } from '../../pureHelpers/state/createDefaultState';

import type { State, ConfigObject } from '../../types';

/**
 * Compiles all config blocks and returns the merged config.
 * Used for runtime-ready project export.
 * All config blocks are combined and compiled as a single source for full schema validation.
 * @param state The current editor state
 * @returns Promise resolving to the merged config object
 */
export async function compileConfigForExport(state: State): Promise<ConfigObject> {
	// If no compileConfig callback, return empty object
	const compileConfig = state.callbacks.compileConfig;
	if (!compileConfig) {
		return state.compiledConfig || defaultConfig;
	}

	// Combine all config blocks
	const combined = combineConfigBlocks(state.graphicHelper.codeBlocks);
	if (combined.source.trim().length === 0) {
		return defaultConfig;
	}

	// Compile all config blocks as a single source for full schema validation
	const { mergedConfig } = await compileConfigFromCombined(combined, compileConfig, state);

	return deepMergeConfig(defaultConfig as unknown as Record<string, unknown>, mergedConfig) as unknown as ConfigObject;
}
