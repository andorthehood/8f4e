import { resolve } from 'path';

import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig({
	...createNodePreset({
		root: __dirname,
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		additionalExclude: [
			'src/**/testUtils.ts',
			'src/**/testFixtures.ts',
			'src/**/testHelpers.ts',
			'src/**/__tests__/**/fixtures/**',
			'packages/**',
		],
		typecheckEnabled: true,
	}),
	resolve: {
		alias: {
			'@8f4e/editor-state': resolve(__dirname, 'packages/editor-state/src/index.ts'),
		},
	},
});
