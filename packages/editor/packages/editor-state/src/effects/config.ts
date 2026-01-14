import { StateManager } from '@8f4e/state-manager';

import { log } from '../impureHelpers/logger/logger';
import isPlainObject from '../pureHelpers/isPlainObject';
import deepMergeConfig from '../pureHelpers/config/deepMergeConfig';
import { combineConfigBlocks } from '../pureHelpers/config/collectConfigBlocks';
import { getConfigSchema } from '../configSchema';
import { defaultConfig } from '../pureHelpers/state/createDefaultState';

import type { CodeError, EventDispatcher, State, ConfigObject, CodeBlockGraphicData } from '../types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface ConfigBuildResult {
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
}

/**
 * Maps an error line number from the combined source to a specific block and local line number.
 * Returns null if the line cannot be mapped to a block.
 */
function mapErrorLineToBlock(
	errorLine: number,
	lineMappings: Array<{ blockId: number; startLine: number; endLine: number }>
): { blockId: number; localLine: number } | null {
	for (const mapping of lineMappings) {
		if (errorLine >= mapping.startLine && errorLine <= mapping.endLine) {
			return {
				blockId: mapping.blockId,
				localLine: errorLine - mapping.startLine + 1, // Convert to 1-based local line
			};
		}
	}
	// Schema-wide errors at line 1 or unmappable lines: map to first block
	if (lineMappings.length > 0) {
		return {
			blockId: lineMappings[0].blockId,
			localLine: 1,
		};
	}
	return null;
}

async function buildConfigFromCombinedSource(
	codeBlocks: CodeBlockGraphicData[],
	compileConfig: CompileConfigFn,
	state: State
): Promise<ConfigBuildResult> {
	const errors: CodeError[] = [];

	// Use runtime registry schema (runtimeRegistry is now required)
	const schema = getConfigSchema(state.runtimeRegistry);

	// Combine all config blocks into a single source
	const { source, lineMappings } = combineConfigBlocks(codeBlocks);

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

		// Check if there are any config blocks
		const { source } = combineConfigBlocks(state.graphicHelper.codeBlocks);
		if (source.trim().length === 0) {
			store.set('compiledConfig', defaultConfig);
			store.set('codeErrors.configErrors', []);
			return;
		}

		const { mergedConfig, errors } = await buildConfigFromCombinedSource(
			state.graphicHelper.codeBlocks,
			state.callbacks.compileConfig,
			state
		);

		console.log(`[Config] Config loaded:`, mergedConfig);
		log(state, `Config loaded with ${errors.length} error(s).`, 'Config');

		// Save all errors to state
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

	// Check if there are any config blocks
	const { source } = combineConfigBlocks(state.graphicHelper.codeBlocks);
	if (source.trim().length === 0) {
		return defaultConfig;
	}

	// Compile all config blocks as a single source for full schema validation
	const { mergedConfig } = await buildConfigFromCombinedSource(state.graphicHelper.codeBlocks, compileConfig, state);

	return deepMergeConfig(defaultConfig as unknown as Record<string, unknown>, mergedConfig) as unknown as ConfigObject;
}
