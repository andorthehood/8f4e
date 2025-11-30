import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		includeSource: ['src/**/*.ts'],
		exclude: ['**/node_modules/**', '**/dist/**', '**/testUtils.ts', '**/__fixtures__/**'],
		environment: 'node',
		typecheck: {
			enabled: true,
			tsconfig: './tsconfig.test.json',
		},
	},
	define: {
		'import.meta.vitest': 'undefined',
	},
});
