import type { ProjectConfig } from './types';

export const defaultProjectConfig: ProjectConfig = {
	runtimeSettings: {
		runtime: 'WebWorkerLogicRuntime',
		sampleRate: 50,
	},
	memorySizeBytes: 1048576,
	disableAutoCompilation: false,
	binaryAssets: [],
};
