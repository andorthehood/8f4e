import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		include: ['tests/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
		typecheckEnabled: true,
	})
);
