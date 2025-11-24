import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
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
		include: ['tests/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**', '**/testUtils.ts', '**/__fixtures__/**'],
	},
});
