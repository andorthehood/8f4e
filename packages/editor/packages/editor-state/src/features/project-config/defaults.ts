import type { ProjectConfig } from './types';
import { defaultColorScheme } from '@8f4e/sprite-generator';

export const defaultProjectConfig: ProjectConfig = {
	runtimeSettings: {
		runtime: 'WebWorkerLogicRuntime',
		sampleRate: 50,
	},
	memorySizeBytes: 1048576,
	disableAutoCompilation: false,
	binaryAssets: [],
	colorScheme: defaultColorScheme,
};
