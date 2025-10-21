import { defineConfig, mergeConfig } from 'vitest/config';

import { vitestPreset } from '../../vitest.preset';

export default mergeConfig(
	vitestPreset,
	defineConfig({
		test: {
			include: ['tests/**/*.test.ts'],
			exclude: ['**/node_modules/**', '**/dist/**', '**/testUtils.ts', '**/__fixtures__/**'],
		},
	})
);
