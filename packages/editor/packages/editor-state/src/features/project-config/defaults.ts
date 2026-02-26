import { defaultColorScheme } from '@8f4e/sprite-generator';

import type { ProjectConfig } from './types';

export const defaultProjectConfig: ProjectConfig = {
	runtimeSettings: {
		runtime: 'WebWorkerLogicRuntime',
		sampleRate: 50,
	},
	memorySizeBytes: 1048576,
	disableAutoCompilation: false,
	colorScheme: defaultColorScheme,
};
