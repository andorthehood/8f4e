import deepMergeConfig from '../config-compiler/utils/deepMergeConfig';
import { combineConfigBlocks } from '../config-compiler/utils/combineConfigBlocks';
import { compileConfigFromCombined } from '../config-compiler/utils/compileConfigFromCombined';

import type { State, ProjectConfig } from '~/types';

import { defaultProjectConfig } from '~/pureHelpers/state/createDefaultState';

/**
 * Compiles all project config blocks and returns the merged config.
 * Used for runtime-ready project export.
 * All project config blocks are combined and compiled as a single source for full schema validation.
 * @param state The current editor state
 * @returns Promise resolving to the merged project config object
 */
export async function compileConfigForExport(state: State): Promise<ProjectConfig> {
	// If no compileConfig callback, return empty object
	const compileConfig = state.callbacks.compileConfig;
	if (!compileConfig) {
		return state.compiledProjectConfig || defaultProjectConfig;
	}

	// Combine all config blocks
	const combined = combineConfigBlocks(state.graphicHelper.codeBlocks);
	if (combined.source.trim().length === 0) {
		return defaultProjectConfig;
	}

	// Compile all config blocks as a single source for full schema validation
	const { mergedConfig } = await compileConfigFromCombined(combined, compileConfig, state);

	return deepMergeConfig(
		defaultProjectConfig as unknown as Record<string, unknown>,
		mergedConfig
	) as unknown as ProjectConfig;
}
