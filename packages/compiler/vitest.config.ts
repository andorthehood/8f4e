import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		include: [
			'tests/**/*.test.ts',
			'src/graphOptimizer.ts',
			'src/semantic/**/*.test.ts',
			'src/withValidation/**/*.ts',
			'src/wasmBuilders/**/*.ts',
			'src/utils/**/*.ts',
			'src/instructionCompilers/**/*.ts',
		],
		additionalExclude: [
			'**/testUtils.ts',
			'**/__fixtures__/**',
			'**/type.ts',
			'**/wasmInstruction.ts',
			'**/consts.ts',
			'**/index.ts',
			'**/section.ts',
			'**/syntaxError.ts',
			'**/resolveInterModularConnections.ts',
		],
		typecheckEnabled: true,
	})
);
