import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig({
	...createNodePreset({
		include: ['tests/**/*.test.ts'],
		additionalExclude: ['**/testUtils.ts', '**/__fixtures__/**'],
		typecheckEnabled: true,
	}),
	test: {
		...createNodePreset({
			include: ['tests/**/*.test.ts'],
			additionalExclude: ['**/testUtils.ts', '**/__fixtures__/**'],
			typecheckEnabled: true,
		}).test,
		includeSource: ['src/instructionCompilers/**/*.ts'],
	},
	define: {
		'import.meta.vitest': 'undefined',
	},
});
