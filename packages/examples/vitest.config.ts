import { createNodePreset } from '@8f4e/config/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig(
	createNodePreset({
		include: ['src/module-generators/*.test.ts'],
		typecheckTsconfig: './tsconfig.typecheck.json',
	})
);
