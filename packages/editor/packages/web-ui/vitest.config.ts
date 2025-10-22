import { defineConfig, mergeConfig } from 'vitest/config';

import { vitestPreset } from '../../../../vitest.preset';

export default mergeConfig(
	vitestPreset,
	defineConfig({
		test: {
			passWithNoTests: true,
			environment: 'jsdom',
			include: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
		},
		define: {
			// Ensure proper environment for browser testing
			'process.env.NODE_ENV': '"test"',
		},
	})
);
