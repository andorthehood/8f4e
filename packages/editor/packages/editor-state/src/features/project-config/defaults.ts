import type { ProjectConfig } from './types';

export const defaultProjectConfig: ProjectConfig = {
	runtimeSettings: {
		runtime: 'WebWorkerLogicRuntime',
		sampleRate: 50,
	},
	disableAutoCompilation: false,
};
