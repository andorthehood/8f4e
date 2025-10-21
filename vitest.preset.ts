import { defineConfig } from 'vitest/config';

// Shared Vitest configuration for all packages
export const vitestPreset = defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.{test,spec}.ts'],
		},
		include: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['**/node_modules/**', '**/dist/**'],
	},
});
