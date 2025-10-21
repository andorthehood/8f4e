import { defineConfig, mergeConfig } from 'vitest/config';

import { vitestPreset } from '../../../../vitest.preset';

export default mergeConfig(
	vitestPreset,
	defineConfig({
		test: {
			passWithNoTests: true,
		},
	})
);
