import { defineConfig, mergeConfig } from 'vitest/config';

import { vitestPreset } from '../../../../vitest.preset';

export default mergeConfig(
	vitestPreset,
	defineConfig({
		test: {
			passWithNoTests: true,
			include: ['tests/**/*.{test,spec}.ts'],
			exclude: ['**/node_modules/**', '**/dist/**', 'screenshot-tests/**'],
		},
	})
);
