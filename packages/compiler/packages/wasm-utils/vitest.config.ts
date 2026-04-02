import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		include: ['src/**/*.ts'],
		additionalExclude: ['**/index.ts', '**/type.ts', '**/wasmInstruction.ts', '**/consts.ts', '**/section.ts'],
		typecheckEnabled: true,
	})
);
