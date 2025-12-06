import { StateManager } from '@8f4e/state-manager';

import { log } from '../impureHelpers/logger';
import { applyConfigToState } from '../impureHelpers/config';
import { isPlainObject } from '../pureHelpers/isPlainObject';
import { deepMergeConfig } from '../pureHelpers/config/deepMergeConfig';
import { collectConfigBlocks, ConfigBlockSource } from '../pureHelpers/config/collectConfigBlocks';

import type { ConfigObject } from '../impureHelpers/config';
import type { ConfigError, EventDispatcher, State } from '../types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface ConfigBuildResult {
	mergedConfig: Record<string, unknown>;
	errors: ConfigError[];
}

async function buildConfigFromBlocks(
	configBlocks: ConfigBlockSource[],
	compileConfig: CompileConfigFn
): Promise<ConfigBuildResult> {
	let mergedConfig: Record<string, unknown> = {};
	const errors: ConfigError[] = [];

	for (const { block, source } of configBlocks) {
		try {
			const result = await compileConfig(source);

			if (result.errors.length > 0) {
				const blockErrors: ConfigError[] = result.errors.map(error => ({
					line: error.line,
					message: error.message,
					creationIndex: block.creationIndex,
				}));
				errors.push(...blockErrors);
				continue;
			}

			if (result.config !== null && isPlainObject(result.config)) {
				mergedConfig = deepMergeConfig(mergedConfig, result.config as Record<string, unknown>);
			}
		} catch (error) {
			errors.push({
				line: 1,
				message: error instanceof Error ? error.message : String(error),
				creationIndex: block.creationIndex,
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
	 * Errors are saved to state.configErrors with the creationIndex of the source block.
	 */
	async function rebuildConfig(): Promise<void> {
		const compileConfig = state.callbacks.compileConfig;
		if (!compileConfig) {
			return;
		}

		const configBlocks = collectConfigBlocks(state.graphicHelper.codeBlocks);

		state.configErrors = [];

		if (configBlocks.length === 0) {
			return;
		}

		const { mergedConfig, errors } = await buildConfigFromBlocks(configBlocks, compileConfig);

		console.log(`[Config] Config loaded:`, mergedConfig);
		log(state, `Config loaded with ${errors.length} error(s).`, 'Config');

		// Save all errors to state
		state.configErrors = errors;

		// Apply the merged config to state
		if (isPlainObject(mergedConfig)) {
			applyConfigToState(store, mergedConfig as ConfigObject);
		}
	}

	// Wire up event handlers
	// rebuildConfig runs BEFORE module compilation because blockTypeUpdater runs first
	events.on('codeBlockAdded', rebuildConfig);
	events.on('deleteCodeBlock', rebuildConfig);
	events.on('projectLoaded', rebuildConfig);
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
export async function compileConfigForExport(state: State): Promise<Record<string, unknown>> {
	// If no compileConfig callback, return empty object
	const compileConfig = state.callbacks.compileConfig;
	if (!compileConfig) {
		return {};
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
