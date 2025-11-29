import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		passWithNoTests: true,
		typecheckEnabled: false,
	})
);
