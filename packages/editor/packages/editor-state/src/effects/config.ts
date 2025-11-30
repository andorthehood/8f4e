import { StateManager } from '@8f4e/state-manager';

import type { CodeBlockGraphicData, EventDispatcher, State, Runtimes } from '../types';

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
 * Collects all config blocks and builds a single config source string.
 * Config blocks are concatenated in creation order.
 */
function collectConfigSource(codeBlocks: Set<CodeBlockGraphicData>): string {
	const configBlocks = Array.from(codeBlocks)
		.filter(block => block.blockType === 'config')
		.sort((a, b) => a.creationIndex - b.creationIndex);

	const sources: string[] = [];
	for (const block of configBlocks) {
		const body = extractConfigBody(block.code);
		if (body.length > 0) {
			sources.push(body.join('\n'));
		}
	}

	return sources.join('\n');
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
		// Validate each runtime setting has the required fields
		const validRuntimeSettings = typedConfig.runtimeSettings.filter((setting): setting is Runtimes => {
			if (!isPlainObject(setting)) return false;
			const s = setting as Record<string, unknown>;
			return typeof s.runtime === 'string' && typeof s.sampleRate === 'number';
		});

		if (validRuntimeSettings.length > 0) {
			state.compiler.runtimeSettings = validRuntimeSettings;
		}
	}
}

/**
 * Clears config errors from all config blocks.
 */
function clearConfigErrors(state: State): void {
	for (const block of state.graphicHelper.codeBlocks) {
		if (block.blockType === 'config') {
			// Clear any config-related error messages (we don't add any for now)
		}
	}
}

/**
 * Effect that compiles config blocks and applies the resulting configuration to state.
 * Config blocks are processed in creation order and their outputs are merged.
 */
export default function configEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Rebuilds the config from all config blocks and applies it to state.
	 */
	async function rebuildConfig(): Promise<void> {
		// If no compileConfig callback, skip
		if (!state.callbacks.compileConfig) {
			return;
		}

		// Check if there are any config blocks
		const hasConfigBlocks = Array.from(state.graphicHelper.codeBlocks).some(block => block.blockType === 'config');

		if (!hasConfigBlocks) {
			return;
		}

		// Collect all config source
		const source = collectConfigSource(state.graphicHelper.codeBlocks);

		if (!source.trim()) {
			return;
		}

		try {
			const result = await state.callbacks.compileConfig(source);

			if (result.errors.length > 0) {
				// Log errors for now - could be surfaced to UI in future
				console.warn('[Config] Compilation errors:', result.errors);
				return;
			}

			// Clear any previous config errors
			clearConfigErrors(state);

			// Apply the config to state
			if (result.config !== null) {
				applyConfigToState(state, result.config);
			}
		} catch (error) {
			console.error('[Config] Compilation failed:', error);
		}
	}

	// Wire up event handlers
	// rebuildConfig runs BEFORE module compilation because blockTypeUpdater runs first
	events.on('codeBlockAdded', rebuildConfig);
	events.on('deleteCodeBlock', rebuildConfig);
	events.on('projectLoaded', rebuildConfig);
	store.subscribe('graphicHelper.selectedCodeBlock.code', rebuildConfig);
}

// Export for testing
export { extractConfigBody, collectConfigSource, applyConfigToState };
