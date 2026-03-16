import type { ProjectConfig } from './types';
import type { Runtimes } from '../runtime/types';

export const defaultRuntimeSettings: Runtimes = {
	runtime: 'WebWorkerLogicRuntime',
	sampleRate: 50,
};

export function createDefaultProjectConfig(runtimeSettings: Runtimes): ProjectConfig {
	return {
		runtimeSettings,
		disableAutoCompilation: false,
	};
}

export const defaultProjectConfig: ProjectConfig = createDefaultProjectConfig(defaultRuntimeSettings);
