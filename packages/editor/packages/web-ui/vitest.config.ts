import { defineConfig, mergeConfig } from 'vitest/config';

import { vitestPreset } from '../../../../vitest.preset';

export default mergeConfig(
	vitestPreset,
	defineConfig({
		test: {
			passWithNoTests: true,
			environment: 'node',
			include: ['src/**/*.{test,spec}.{ts,tsx}'],
			exclude: ['screenshot-tests/**'],
		},
		define: {
			'process.env.NODE_ENV': '"test"',
		},
	})
);
