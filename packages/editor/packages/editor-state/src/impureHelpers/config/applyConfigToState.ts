import { isPlainObject } from '../../pureHelpers/isPlainObject';

import type { State, Runtimes } from '../../types';

/**
 * Interface for the expected config object structure
 */
export interface ConfigObject {
	title?: string;
	author?: string;
	description?: string;
	memorySizeBytes?: number;
	selectedRuntime?: number;
	runtimeSettings?: Runtimes[];
}

/**
 * Applies the compiled config object to the editor state.
 * Maps specific config paths to state properties.
 */
export function applyConfigToState(state: State, config: ConfigObject): void {
	if (typeof config.title === 'string') {
		state.projectInfo.title = config.title;
	}
	if (typeof config.author === 'string') {
		state.projectInfo.author = config.author;
	}
	if (typeof config.description === 'string') {
		state.projectInfo.description = config.description;
	}

	if (typeof config.memorySizeBytes === 'number') {
		state.compiler.compilerOptions.memorySizeBytes = config.memorySizeBytes;
	}

	if (typeof config.selectedRuntime === 'number') {
		state.runtime.selectedRuntime = config.selectedRuntime;
	}

	if (Array.isArray(config.runtimeSettings)) {
		const validRuntimeTypes = [
			'WebWorkerLogicRuntime',
			'MainThreadLogicRuntime',
			'AudioWorkletRuntime',
			'WebWorkerMIDIRuntime',
		];

		const validRuntimeSettings = config.runtimeSettings.filter((setting): setting is Runtimes => {
			if (!isPlainObject(setting)) return false;
			const s = setting as Record<string, unknown>;
			return typeof s.runtime === 'string' && validRuntimeTypes.includes(s.runtime) && typeof s.sampleRate === 'number';
		});

		if (validRuntimeSettings.length > 0) {
			state.runtime.runtimeSettings = validRuntimeSettings;
		}
	}
}
