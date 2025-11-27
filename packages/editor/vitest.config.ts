import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	test: {
		globals: false,
		environment: 'node',
		testTimeout: 30000,
		hookTimeout: 10000,
		reporters: process.env.CI
			? [
					[
						'default',
						{
							summary: false,
						},
					],
				]
			: ['default'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.{test,spec}.ts'],
		},
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'src/**/testUtils.ts',
			'src/**/testFixtures.ts',
			'src/**/testHelpers.ts',
			'src/**/__tests__/**/fixtures/**',
			'packages/**',
		],
		typecheck: {
			enabled: true,
			tsconfig: './tsconfig.test.json',
		},
	},
	resolve: {
		alias: {
			'@8f4e/editor-state': resolve(__dirname, 'packages/editor-state/src/index.ts'),
		},
	},
});
