import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

const preset = createNodePreset({
	include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
	typecheckEnabled: true,
});

export default defineConfig({
	...preset,
	test: {
		...preset.test,
		includeSource: ['src/**/*.ts'],
	},
});
