import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		testTimeout: 30000,
		hookTimeout: 10000,
		reporters: process.env.CI ? ['basic'] : ['default'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.{test,spec}.ts'],
		},
		include: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
		exclude: ['**/node_modules/**', '**/dist/**'],
		passWithNoTests: true,
	},
	define: {
		// Ensure proper environment for browser testing
		'process.env.NODE_ENV': '"test"',
	},
});
