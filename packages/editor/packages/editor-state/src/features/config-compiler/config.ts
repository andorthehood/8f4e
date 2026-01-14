import { StateManager } from '@8f4e/state-manager';

import deepMergeConfig from './deepMergeConfig';
import { combineConfigBlocks } from './combineConfigBlocks';
import { mapErrorLineToBlock } from './mapErrorLineToBlock';
import { getConfigSchema } from './configSchema';
import isPlainObject from './isPlainObject';

import { log } from '../../impureHelpers/logger/logger';
import { defaultConfig } from '../../pureHelpers/state/createDefaultState';

import type { CodeError, EventDispatcher, State, ConfigObject } from '../../types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface ConfigBuildResult {
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
}

async function compileConfigFromCombined(
	combined: ReturnType<typeof combineConfigBlocks>,
	compileConfig: CompileConfigFn,
	state: State
): Promise<ConfigBuildResult> {
	const errors: CodeError[] = [];

	// Use runtime registry schema (runtimeRegistry is now required)
	const schema = getConfigSchema(state.runtimeRegistry);

	const { source, lineMappings } = combined;

	// If no config source, return empty config
	if (source.trim().length === 0) {
		return { mergedConfig: {}, errors };
	}

	try {
		// Compile once with the combined source for full schema validation
		const result = await compileConfig(source, schema);

		// Map errors back to individual blocks
		if (result.errors.length > 0) {
			for (const error of result.errors) {
				const mapped = mapErrorLineToBlock(error.line, lineMappings);
				if (mapped) {
					errors.push({
						lineNumber: mapped.localLine,
						message: error.message,
						codeBlockId: mapped.blockId,
					});
				}
			}
		}

		// Use the compiled config directly if available
		let mergedConfig: Record<string, unknown> = {};
		if (result.config !== null && isPlainObject(result.config)) {
			mergedConfig = result.config as Record<string, unknown>;
		}

		return { mergedConfig, errors };
	} catch (error) {
		// On exception, attribute to the first block
		if (lineMappings.length > 0) {
			errors.push({
				lineNumber: 1,
				message: error instanceof Error ? error.message : String(error),
				codeBlockId: lineMappings[0].blockId,
			});
		}
		return { mergedConfig: {}, errors };
	}
}

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
		if (state.graphicHelper.selectedCodeBlock?.blockType !== 'config') {
			return;
		}
		rebuildConfig();
	});
}

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
