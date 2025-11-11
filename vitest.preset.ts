import { defineConfig } from 'vitest/config';

// Shared Vitest configuration for all packages
export const vitestPreset = defineConfig({
	test: {
		globals: true,
		environment: 'node',
		testTimeout: 30000, // 30 seconds max per test
		hookTimeout: 10000, // 10 seconds max for beforeEach/afterEach
		// Use 'default' reporter which shows test names and failures without breaking CI
		// CI detection: GitHub Actions sets CI=true
		reporters: process.env.CI ? ['basic'] : ['default'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.{test,spec}.ts'],
		},
		include: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['**/node_modules/**', '**/dist/**'],
	},
});
