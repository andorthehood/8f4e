import path from 'path';

import { defineConfig } from 'vitest/config';
import { sharedTestConfig, getReporters } from '@8f4e/config/vitest';

export default defineConfig({
	test: {
		...sharedTestConfig,
		reporters: getReporters(),
		include: ['src/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
		environment: 'node',
		typecheck: {
			enabled: true,
			tsconfig: './tsconfig.test.json',
		},
	},
	resolve: {
		alias: {
			'@8f4e/compiler': path.resolve(__dirname, 'packages/compiler/src/index.ts'),
			'@8f4e/stack-config-compiler': path.resolve(__dirname, 'packages/stack-config-compiler/src/index.ts'),
			'@8f4e/editor-state': path.resolve(__dirname, 'packages/editor/packages/editor-state/src/index.ts'),
		},
	},
});
