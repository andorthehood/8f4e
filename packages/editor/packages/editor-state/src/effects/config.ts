import { StateManager } from '@8f4e/state-manager';

import type { CodeBlockGraphicData, ConfigError, EventDispatcher, State, Runtimes } from '../types';

/**
 * Extracts the body content between config and configEnd markers.
 * Returns the lines between the markers (exclusive).
 */
function extractConfigBody(code: string[]): string[] {
	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i++) {
		if (/^\s*config(\s|$)/.test(code[i])) {
			startIndex = i;
		} else if (/^\s*configEnd(\s|$)/.test(code[i])) {
			endIndex = i;
		}
	}

	if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
		return [];
	}

	return code.slice(startIndex + 1, endIndex);
}

/**
 * Represents a config block source with its block reference for error mapping.
 */
interface ConfigBlockSource {
	block: CodeBlockGraphicData;
	source: string;
}

/**
 * Collects all config blocks and returns their sources individually.
 * Config blocks are sorted in creation order.
 * Each config block is compiled independently to allow proper error mapping.
 */
function collectConfigBlocks(codeBlocks: Set<CodeBlockGraphicData>): ConfigBlockSource[] {
	return Array.from(codeBlocks)
		.filter(block => block.blockType === 'config')
		.sort((a, b) => a.creationIndex - b.creationIndex)
		.map(block => {
			const body = extractConfigBody(block.code);
			return {
				block,
				source: body.join('\n'),
			};
		})
		.filter(item => item.source.trim().length > 0);
}

/**
 * Type guard to check if a value is an object (not null or array)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Interface for the expected config object structure
 */
interface ConfigObject {
	projectInfo?: {
		title?: string;
		author?: string;
		description?: string;
	};
	memorySizeBytes?: number;
	selectedRuntime?: number;
	runtimeSettings?: Runtimes[];
}

/**
 * Applies the compiled config object to the editor state.
 * Maps specific config paths to state properties.
 */
function applyConfigToState(state: State, config: unknown): void {
	if (!isPlainObject(config)) {
		return;
	}

	const typedConfig = config as ConfigObject;

	// Apply project info
	if (isPlainObject(typedConfig.projectInfo)) {
		const projectInfo = typedConfig.projectInfo;
		if (typeof projectInfo.title === 'string') {
			state.projectInfo.title = projectInfo.title;
		}
		if (typeof projectInfo.author === 'string') {
			state.projectInfo.author = projectInfo.author;
		}
		if (typeof projectInfo.description === 'string') {
			state.projectInfo.description = projectInfo.description;
		}
	}

	// Apply memory size
	if (typeof typedConfig.memorySizeBytes === 'number') {
		state.compiler.compilerOptions.memorySizeBytes = typedConfig.memorySizeBytes;
	}

	// Apply selected runtime
	if (typeof typedConfig.selectedRuntime === 'number') {
		state.compiler.selectedRuntime = typedConfig.selectedRuntime;
	}

	// Apply runtime settings
	if (Array.isArray(typedConfig.runtimeSettings)) {
		// Valid runtime type values
		const validRuntimeTypes = [
			'WebWorkerLogicRuntime',
			'MainThreadLogicRuntime',
			'AudioWorkletRuntime',
			'WebWorkerMIDIRuntime',
		];

		// Validate each runtime setting has the required fields and valid runtime type
		const validRuntimeSettings = typedConfig.runtimeSettings.filter((setting): setting is Runtimes => {
			if (!isPlainObject(setting)) return false;
			const s = setting as Record<string, unknown>;
			return typeof s.runtime === 'string' && validRuntimeTypes.includes(s.runtime) && typeof s.sampleRate === 'number';
		});

		if (validRuntimeSettings.length > 0) {
			state.compiler.runtimeSettings = validRuntimeSettings;
		}
	}
}

/**
 * Deep merges two config objects. Later values override earlier values.
 * Arrays are replaced entirely, not merged.
 */
function deepMergeConfig(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = { ...target };

	for (const key of Object.keys(source)) {
		const sourceValue = source[key];
		const targetValue = result[key];

		if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
			result[key] = deepMergeConfig(targetValue, sourceValue);
		} else {
			result[key] = sourceValue;
		}
	}

	return result;
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
		// If no compileConfig callback, skip
		if (!state.callbacks.compileConfig) {
			return;
		}

		// Collect all config blocks
		const configBlocks = collectConfigBlocks(state.graphicHelper.codeBlocks);

		// Clear previous config errors
		state.configErrors = [];

		if (configBlocks.length === 0) {
			return;
		}

		// Compile each config block independently and merge results
		let mergedConfig: Record<string, unknown> = {};
		const allErrors: ConfigError[] = [];

		for (const { block, source } of configBlocks) {
			try {
				const result = await state.callbacks.compileConfig(source);

				if (result.errors.length > 0) {
					// Map errors to ConfigError format with creationIndex
					const blockErrors: ConfigError[] = result.errors.map(error => ({
						line: error.line,
						message: error.message,
						creationIndex: block.creationIndex,
					}));
					allErrors.push(...blockErrors);
					continue; // Skip this block but continue with others
				}

				// Merge the config into the accumulated result
				if (result.config !== null && isPlainObject(result.config)) {
					mergedConfig = deepMergeConfig(mergedConfig, result.config as Record<string, unknown>);
				}
			} catch (error) {
				// For unexpected errors, create a generic error entry
				allErrors.push({
					line: 1,
					message: error instanceof Error ? error.message : String(error),
					creationIndex: block.creationIndex,
				});
			}
		}

		// Save all errors to state
		state.configErrors = allErrors;

		// Apply the merged config to state
		applyConfigToState(state, mergedConfig);
	}

	// Wire up event handlers
	// rebuildConfig runs BEFORE module compilation because blockTypeUpdater runs first
	events.on('codeBlockAdded', rebuildConfig);
	events.on('deleteCodeBlock', rebuildConfig);
	events.on('projectLoaded', rebuildConfig);
	store.subscribe('graphicHelper.selectedCodeBlock.code', rebuildConfig);
}

// Export for testing
export { extractConfigBody, collectConfigBlocks, deepMergeConfig, applyConfigToState };

/**
 * Compiles all config blocks and returns the merged config.
 * Used for runtime-ready project export.
 * @param state The current editor state
 * @returns Promise resolving to the merged config object
 */
export async function compileConfigForExport(state: State): Promise<Record<string, unknown>> {
	// If no compileConfig callback, return empty object
	if (!state.callbacks.compileConfig) {
		return {};
	}

	// Collect all config blocks
	const configBlocks = collectConfigBlocks(state.graphicHelper.codeBlocks);

	if (configBlocks.length === 0) {
		return {};
	}

	// Compile each config block independently and merge results
	let mergedConfig: Record<string, unknown> = {};

	for (const { source } of configBlocks) {
		try {
			const result = await state.callbacks.compileConfig(source);

			// Skip blocks with errors
			if (result.errors.length > 0) {
				continue;
			}

			// Merge the config into the accumulated result
			if (result.config !== null && isPlainObject(result.config)) {
				mergedConfig = deepMergeConfig(mergedConfig, result.config as Record<string, unknown>);
			}
		} catch {
			// Skip blocks that fail to compile
			continue;
		}
	}

	return mergedConfig;
}
