import { StateManager } from '@8f4e/state-manager';

import { log } from '../impureHelpers/logger/logger';
// import { applyConfigToState } from '../impureHelpers/config/applyConfigToState';
import isPlainObject from '../pureHelpers/isPlainObject';
import deepMergeConfig from '../pureHelpers/config/deepMergeConfig';
import { collectConfigBlocks, ConfigBlockSource } from '../pureHelpers/config/collectConfigBlocks';
import configSchema from '../configSchema';

import type { CodeError, EventDispatcher, State, ConfigObject } from '../types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface ConfigBuildResult {
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
}

async function buildConfigFromBlocks(
	configBlocks: ConfigBlockSource[],
	compileConfig: CompileConfigFn
): Promise<ConfigBuildResult> {
	let mergedConfig: Record<string, unknown> = {};
	const errors: CodeError[] = [];

	for (const { block, source } of configBlocks) {
		try {
			const result = await compileConfig(source, configSchema);

			if (result.errors.length > 0) {
				const blockErrors: CodeError[] = result.errors.map(error => ({
					lineNumber: error.line,
					message: error.message,
					codeBlockId: block.creationIndex,
				}));
				errors.push(...blockErrors);
				continue;
			}

			if (result.config !== null && isPlainObject(result.config)) {
				mergedConfig = deepMergeConfig(mergedConfig, result.config as Record<string, unknown>);
			}
		} catch (error) {
			errors.push({
				lineNumber: 1,
				message: error instanceof Error ? error.message : String(error),
				codeBlockId: block.creationIndex,
			});
		}
	}

	return { mergedConfig, errors };
}

/**
 * Effect that compiles config blocks and applies the resulting configuration to state.
 * Each config block is compiled independently and results are deep merged in creation order.
 */
export default function configEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Rebuilds the config from all config blocks and applies it to state.
	 * Each config block is compiled independently to allow proper error mapping.
	 * Errors are saved to codeErrors.configErrors with the creationIndex of the source block.
	 */
	async function rebuildConfig(): Promise<void> {
		// If the compileConfig callback is not available but the project contains the compiled config.
		if (state.initialProjectState?.compiledConfig && !state.callbacks.compileConfig) {
			store.set('compiledConfig', state.initialProjectState.compiledConfig);
			return;
		}

		if (!state.callbacks.compileConfig) {
			// TODO: come up with a default config.
			store.set('compiledConfig', {});
			return;
		}

		const configBlocks = collectConfigBlocks(state.graphicHelper.codeBlocks);

		if (configBlocks.length === 0) {
			// TODO: come up with a default config.
			store.set('compiledConfig', {});
			return;
		}

		const { mergedConfig, errors } = await buildConfigFromBlocks(configBlocks, state.callbacks.compileConfig);

		console.log(`[Config] Config loaded:`, mergedConfig);
		log(state, `Config loaded with ${errors.length} error(s).`, 'Config');

		// Save all errors to state
		store.set('codeErrors.configErrors', errors);
		store.set('compiledConfig', mergedConfig);
	}

	// Wire up event handlers
	events.on('compileConfig', rebuildConfig);
	store.subscribe('graphicHelper.codeBlocks', rebuildConfig);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (state.graphicHelper.selectedCodeBlock?.blockType !== 'config') {
			return;
		}
		rebuildConfig();
	});
}

/**
 * Compiles all config blocks and returns the merged config.
 * Used for runtime-ready project export.
 * @param state The current editor state
 * @returns Promise resolving to the merged config object
 */
export async function compileConfigForExport(state: State): Promise<ConfigObject> {
	// If no compileConfig callback, return empty object
	const compileConfig = state.callbacks.compileConfig;
	if (!compileConfig) {
		return state.compiledConfig || {};
	}

	// Collect all config blocks
	const configBlocks = collectConfigBlocks(state.graphicHelper.codeBlocks);

	if (configBlocks.length === 0) {
		return {};
	}

	// Compile each config block independently and merge results
	const { mergedConfig } = await buildConfigFromBlocks(configBlocks, compileConfig);

	return mergedConfig;
}
