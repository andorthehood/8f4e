import { defineConfig } from 'vitest/config';
import { sharedTestConfig, getReporters } from '@8f4e/config/vitest';

// Shared Vitest configuration for all packages
// This file is kept for backward compatibility with packages that haven't migrated to @8f4e/config/vitest
export const vitestPreset = defineConfig({
	test: {
		...sharedTestConfig,
		reporters: getReporters(),
		include: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{test,spec}.{ts,tsx}'],
		// Enable typechecking for test files using tsconfig.test.json if it exists
		typecheck: {
			enabled: true,
			tsconfig: './tsconfig.test.json',
		},
	},
});
