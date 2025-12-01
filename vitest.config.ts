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
});
