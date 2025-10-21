import { resolve } from 'path';

import { defineConfig, mergeConfig } from 'vitest/config';

import { vitestPreset } from '../../vitest.preset';

export default mergeConfig(
	vitestPreset,
	defineConfig({
		test: {
			environment: 'node',
			include: ['src/**/*.{test,spec}.ts'],
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'src/**/testUtils.ts',
				'src/**/testFixtures.ts',
				'src/**/testHelpers.ts',
				'**/packages/glugglug/**',
			],
		},
		resolve: {
			alias: {
				'@8f4e/editor-state': resolve(__dirname, 'packages/editor-state/src/index.ts'),
			},
		},
	})
);
