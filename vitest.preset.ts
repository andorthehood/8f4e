import { defineConfig } from 'vitest/config';

// Shared Vitest configuration for all packages
export const vitestPreset = defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts', '**/tests/**'],
		},
		include: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
		exclude: ['**/node_modules/**', '**/dist/**'],
	},
});
