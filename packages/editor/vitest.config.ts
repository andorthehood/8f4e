import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

import { vitestPreset } from '../../vitest.preset';

const presetTestConfig = vitestPreset.test ?? {};

export default defineConfig({
	...vitestPreset,
	root: __dirname,
	test: {
		...presetTestConfig,
		environment: 'node',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: [
			...(presetTestConfig.exclude ?? []),
			'src/**/testUtils.ts',
			'src/**/testFixtures.ts',
			'src/**/testHelpers.ts',
			'src/**/__tests__/**/fixtures/**',
			'packages/**',
		],
	},
	resolve: {
		alias: {
			'@8f4e/editor-state': resolve(__dirname, 'packages/editor-state/src/index.ts'),
		},
	},
});
